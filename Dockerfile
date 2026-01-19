FROM python:3.12-slim

WORKDIR /app

# Install system deps (Cached)
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Install python deps (Cached)
COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install -e .

# Copy your source code
COPY . .

# IMPORTANT: Set PYTHONPATH to the 'src' directory
ENV PYTHONPATH=/app/src

EXPOSE 3000

# Start uvicorn pointing to main.py inside the src folder
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "3000"]

