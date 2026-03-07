FROM python:3.12-slim
WORKDIR /agent
COPY requirements.txt /agent/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r /agent/requirements.txt
COPY agent.py /agent/agent.py
CMD ["python", "agent.py"]
