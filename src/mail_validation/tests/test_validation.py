import os

# Set dummy environment variables so settings.py doesn't crash
os.environ["LISTMONK_URL"] = "http://localhost"
os.environ["LISTMONK_USER"] = "test"
os.environ["LISTMONK_PASS"] = "test"
os.environ["MAILS_SO_API_KEY"] = "test"

import pytest
from fastapi.testclient import TestClient
from main import app
from mail_validation.utils import mailso_client, listmonk_client

client = TestClient(app)

# 1. Test a "Deliverable" email (Should NOT be blacklisted)
def test_validate_deliverable_email(mocker):
    # Mock Mails.so to return 'deliverable'
    mocker.patch(
        "mail_validation.utils.mailso_client.validate_email",
        return_value={"result": "deliverable", "reason": "accepted_email", "score": 100}
    )
    
    response = client.post("/validation/validate-single?email=good@example.com")
    
    assert response.status_code == 200
    assert response.json()["action"] == "none"
    assert response.json()["status"] == "deliverable"

# 2. Test an "Undeliverable" email (Should BE blacklisted)
def test_validate_undeliverable_email(mocker):
    # Mock Mails.so to return 'undeliverable'
    mocker.patch(
        "mail_validation.utils.mailso_client.validate_email",
        return_value={"result": "undeliverable", "reason": "invalid_mailbox", "score": 0}
    )
    
    # Mock Listmonk block_email to return success
    mock_block = mocker.patch(
        "mail_validation.utils.listmonk_client.block_email",
        return_value={"status": "success"}
    )
    
    response = client.post("/validation/validate-single?email=bad@example.com")
    
    assert response.status_code == 200
    assert response.json()["action"] == "blacklisted"
    assert response.json()["status"] == "undeliverable"
    # Verify that the Listmonk block function was actually called
    mock_block.assert_called_once()

# 3. Test Invalid Email Format (Pydantic Validation)
def test_invalid_email_format():
    # If your model uses EmailStr, FastAPI will block this before the logic starts
    response = client.post("/validation/validate-single?email=not-an-email")
    assert response.status_code == 422 # Unprocessable Entity
