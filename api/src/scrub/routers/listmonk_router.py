import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl

from scrub.auth import verify_token
from scrub.jobs.worker import get_queue, start_list_validation
from scrub.models.validation_job_store import JobSource, JobType
from scrub.repositories.history_repository import (
    HistoryRepository,
    get_history_repository,
)
from scrub.repositories.integration_repository import (
    IntegrationRepository,
    get_integration_repository,
)
from scrub.repositories.validation_job_repository import (
    ValidationJobRepository,
    get_validation_job_repository,
)
from scrub.services import listmonk_service

router = APIRouter()


class ListmonkConfig(BaseModel):
    url: HttpUrl
    username: str
    api_token: str


class IntegrationSummary(BaseModel):
    id: int
    url: str
    username: str
    created_at: datetime


class ConnectionTestResponse(BaseModel):
    success: bool
    message: str
    subscriber_count: int | None = None


class ListmonkList(BaseModel):
    id: int
    name: str
    subscriber_count: int
    type: str
    active_job_request_id: str | None = None


class ValidateListResponse(BaseModel):
    job_id: str
    request_id: str
    status: str = "queued"


class ValidationProgressResponse(BaseModel):
    request_id: str
    validated: int


@router.get("/integrations", response_model=list[IntegrationSummary])
async def list_integrations(
    claims: dict = Depends(verify_token),
    repo: IntegrationRepository = Depends(get_integration_repository),
):
    """List all Listmonk integrations for the current user."""
    return repo.list(claims["sub"], claims.get("email"), claims.get("name"))


@router.post("/integrations", response_model=IntegrationSummary, status_code=201)
async def create_integration(
    payload: ListmonkConfig,
    claims: dict = Depends(verify_token),
    repo: IntegrationRepository = Depends(get_integration_repository),
):
    """Create a new Listmonk integration for the current user."""
    config = {
        "url": str(payload.url),
        "username": payload.username,
        "api_token": payload.api_token,
    }
    return repo.create(claims["sub"], claims.get("email"), claims.get("name"), config)


@router.get("/integrations/{integration_id}", response_model=IntegrationSummary)
async def get_integration(
    integration_id: int,
    claims: dict = Depends(verify_token),
    repo: IntegrationRepository = Depends(get_integration_repository),
):
    """Get a single Listmonk integration."""
    integration = repo.get_owned(
        integration_id, claims["sub"], claims.get("email"), claims.get("name")
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found.")
    return {
        "id": integration.id,
        "url": integration.config["url"],
        "username": integration.config["username"],
        "created_at": integration.created_at,
    }


@router.put("/integrations/{integration_id}", response_model=IntegrationSummary)
async def update_integration(
    integration_id: int,
    payload: ListmonkConfig,
    claims: dict = Depends(verify_token),
    repo: IntegrationRepository = Depends(get_integration_repository),
):
    """Update credentials for a Listmonk integration."""
    config = {
        "url": str(payload.url),
        "username": payload.username,
        "api_token": payload.api_token,
    }
    result = repo.update_owned(
        integration_id, claims["sub"], claims.get("email"), claims.get("name"), config
    )
    if not result:
        raise HTTPException(status_code=404, detail="Integration not found.")
    return result


@router.delete("/integrations/{integration_id}", status_code=204)
async def delete_integration(
    integration_id: int,
    claims: dict = Depends(verify_token),
    repo: IntegrationRepository = Depends(get_integration_repository),
):
    """Delete a Listmonk integration."""
    if not repo.delete_owned(
        integration_id, claims["sub"], claims.get("email"), claims.get("name")
    ):
        raise HTTPException(status_code=404, detail="Integration not found.")


@router.post(
    "/integrations/{integration_id}/test", response_model=ConnectionTestResponse
)
async def test_integration(
    integration_id: int,
    claims: dict = Depends(verify_token),
    repo: IntegrationRepository = Depends(get_integration_repository),
):
    """Test a saved Listmonk integration."""
    integration = repo.get_owned(
        integration_id, claims["sub"], claims.get("email"), claims.get("name")
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found.")
    return await listmonk_service.test_connection(integration.config)


@router.get("/integrations/{integration_id}/lists", response_model=list[ListmonkList])
async def get_integration_lists(
    integration_id: int,
    claims: dict = Depends(verify_token),
    repo: IntegrationRepository = Depends(get_integration_repository),
    job_repo: ValidationJobRepository = Depends(get_validation_job_repository),
):
    """Fetch mailing lists from a Listmonk integration, enriched with active job status."""
    integration = repo.get_owned(
        integration_id, claims["sub"], claims.get("email"), claims.get("name")
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found.")
    lists = await listmonk_service.get_lists(integration.config)
    active_jobs = job_repo.get_active_request_ids_by_list(claims["sub"], integration_id)
    return [
        {**lst, "active_job_request_id": active_jobs.get(lst["id"])} for lst in lists
    ]


@router.post(
    "/integrations/{integration_id}/lists/{list_id}/validate",
    response_model=ValidateListResponse,
    status_code=202,
)
async def validate_list(
    integration_id: int,
    list_id: int,
    claims: dict = Depends(verify_token),
    repo: IntegrationRepository = Depends(get_integration_repository),
    job_repo: ValidationJobRepository = Depends(get_validation_job_repository),
):
    """Dispatch a job to validate all subscribers in a Listmonk list in batches of 100."""
    integration = repo.get_owned(
        integration_id, claims["sub"], claims.get("email"), claims.get("name")
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found.")
    request_id = str(uuid.uuid4())
    # Create the job record before enqueuing so /jobs/progress is immediately pollable.
    # The worker will update total_items and list_name once it fetches them from Listmonk.
    job_repo.create_job(
        request_id=request_id,
        user_id=claims["sub"],
        job_type=JobType.LISTMONK_LIST,
        source=JobSource.INTEGRATION,
        integration_id=integration_id,
        integration_type="listmonk",
        list_id=list_id,
    )
    job = get_queue().enqueue(
        start_list_validation, integration_id, list_id, claims["sub"], request_id
    )
    return {"job_id": job.id, "request_id": request_id, "status": "queued"}


@router.get(
    "/integrations/{integration_id}/lists/{list_id}/progress/{request_id}",
    response_model=ValidationProgressResponse,
)
async def get_validation_progress(
    integration_id: int,
    list_id: int,
    request_id: str,
    claims: dict = Depends(verify_token),
    history_repo: HistoryRepository = Depends(get_history_repository),
):
    """Return the number of emails validated so far for a running list validation job."""
    validated = history_repo.count_by_request_id(request_id, claims["sub"])
    return {"request_id": request_id, "validated": validated}
