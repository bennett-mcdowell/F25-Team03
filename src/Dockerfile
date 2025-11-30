FROM python:3.12-slim

# Install Node.js for building the React frontend
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY src/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy and build the React frontend
COPY Frontend_Rework ./Frontend_Rework
WORKDIR /app/Frontend_Rework
RUN npm ci && npm run build

# Copy backend
WORKDIR /app
COPY src/Backend/ ./Backend/

# Set working directory to backend
WORKDIR /app/Backend

EXPOSE 5000

CMD ["python", "app.py"]
