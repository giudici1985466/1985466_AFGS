# Use slim Python image
FROM python:3.11-slim

# Avoid Python buffering issues
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install system dependencies (needed for asyncpg)
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY gateway_main.py .

EXPOSE 8200

CMD ["python", "-u", "gateway_main.py"]
