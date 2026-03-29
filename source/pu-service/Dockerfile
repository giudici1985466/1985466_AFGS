FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY pu_main.py .

ENV PYTHONUNBUFFERED=1

CMD ["python", "-u", "pu_main.py"]
