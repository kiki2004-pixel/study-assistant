# Mail-Validator
A high-performance FastAPI microservice designed to protect mail server reputation. It listens to Postmark webhooks, verifies email quality via Mails.so, and automatically updates the Listmonk global blacklist.

## 🚀 The Workflow
Trigger: Postmark sends a webhook event (Bounce or Spam Complaint) to this service.
Verify: The service queries Mails.so to confirm if the email is truly undeliverable.
Action: If invalid, the service calls the Listmonk API to move the email to the Blacklist.
Monitor: All actions are sent to Prometheus and visualized on a Grafana dashboard.

## 🛠 Features
Real-time Blacklisting: Instant processing of Postmark bounce events.
Smart Validation: Double-checks suspicious emails before blocking to avoid false positives.
Grafana Observability: Built-in metrics tracking for "Who, When, and Why" regarding blocked emails.
Client Isolation: Track metrics per client/source (e.g., Fusertech) using Prometheus labels.

## 📊 Metrics & Labels
The service exposes a /metrics endpoint for Grafana with the following labels:
reason: Why it was blocked (e.g., hard_bounce, spam, invalid_mailbox).
source_list: Which client/list the email belonged to (e.g., fusertech_list).
postmark_event_type: The raw event from Postmark (e.g., Bounce, SpamComplaint).

## ⚙️ Environment Configuration
### Create a .env file in the root directory:
env
### API Keys
POSTMARK_WEBHOOK_SECRET=your_postmark_secret
MAILS_SO_API_KEY=your_mails_so_key

### Listmonk Connection
LISTMONK_URL=https://your-listmonk-instance.com
LISTMONK_USER=admin
LISTMONK_PASS=your_secure_password

## 🏗 Setup & Installation
 **Initialize Environment:**
bash
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn prometheus-fastapi-instrumentator requests

 **Run Service:**
**Option A Full Stack (App + Monitoring)**

bash
docker compose up -d

**Option B Local Development**

bash
uv run fastapi dev --reload --port 3000 src/main.py 