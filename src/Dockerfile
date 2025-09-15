FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy frontend folder into container
COPY Frontend/ ./Frontend/
COPY Backend/ ./Backend/

# Set working directory to backend
WORKDIR /app/Backend

EXPOSE 5000

CMD ["python", "app.py"]
