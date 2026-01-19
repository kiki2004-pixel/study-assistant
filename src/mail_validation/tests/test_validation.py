import os

# Set dummy environment variables so settings.py doesn't crash during test init
os.environ["LISTMONK_URL"] = "http://localhost"
os.environ["LISTMONK_USER"] = "test"
os.environ["LISTMONK_PASS"] = "test"
os.environ["MAILS_SO_API_KEY"] = "test"

from fastapi.testclient import TestClient
from main import app 

client = TestClient(app)

# 1. Test a "Deliverable" email
def test_validate_deliverable_email(mocker):
    # Mock Mails.so return value
    mocker.patch(
        "mail_validation.utils.mailso_client.validate_email",
        return_value={"result": "deliverable", "reason": "accepted_email", "score": 100}
    )
    
    response = client.post("/validation/validate-single?email=good@example.com")
    
    assert response.status_code == 200
    assert response.json()["status"] == "deliverable"
    assert response.json()["score"] == 100

# 2. Test an "Undeliverable" email 
def test_validate_undeliverable_email(mocker):
    # Mock Mails.so return value
    mocker.patch(
        "mail_validation.utils.mailso_client.validate_email",
        return_value={"result": "undeliverable", "reason": "invalid_mailbox", "score": 0}
    )
    
    
    response = client.post("/validation/validate-single?email=bad@example.com")
    
    assert response.status_code == 200
    assert response.json()["status"] == "undeliverable"
    assert response.json()["score"] == 0

# 3. Test Invalid Email Format (Pydantic Validation)
def test_invalid_email_format():
    # This triggers a 422 before the logic even hits the mocks
    response = client.post("/validation/validate-single?email=not-an-email")
    assert response.status_code == 422
