from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

from scrub.settings import get_settings, block_ssrf

router = APIRouter()

class ListmonkSettings(BaseModel):
    listmonk_url: str
    listmonk_user: str
    listmonk_pass: str
    listmonk_list_id: str
    listmonk_exclude_name_substrings: str = ""


class IntegrationSummary(BaseModel):
    id: int
    url: str
    username: str
    created_at: datetime


class ConnectionTestResponse(BaseModel):
    success: bool
    message: str
    subscriber_count: int | None = None


@router.get("/settings", response_model=ListmonkSettingsResponse)
async def get_listmonk_settings():
    """
    Returns the current Listmonk integration settings.
    Password is intentionally excluded from the response.
    """
    s = get_settings()
    return ListmonkSettingsResponse(
        listmonk_url=s.listmonk_url,
        listmonk_user=s.listmonk_user,
        listmonk_list_id=s.listmonk_list_id,
        listmonk_exclude_name_substrings=s.listmonk_exclude_name_substrings,
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found.")
    return {
        "id": integration.id,
        "url": integration.config["url"],
        "username": integration.config["username"],
        "created_at": integration.created_at,
    }


@router.post("/test-connection", response_model=ConnectionTestResponse)
async def test_listmonk_connection(payload: ListmonkSettings):
    """
    Tests a Listmonk connection using the provided credentials.
    Hits the /api/health endpoint and fetches subscriber count to verify access.
    """
    try:
        async with httpx.AsyncClient(
            base_url=payload.listmonk_url,
            headers={
                "Authorization": f"token {payload.listmonk_user}:{payload.listmonk_pass}"
            },
            timeout=5.0,
        ) as client:
            # 1. Health check
            health = await client.get("/api/health")
            health.raise_for_status()


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
