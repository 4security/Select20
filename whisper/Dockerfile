FROM python:latest
WORKDIR /usr/app/src
RUN apt-get update && apt install ffmpeg -y
RUN pip install --upgrade pip
RUN pip3 install -U --default-timeout=100 flask flask-cors
RUN pip3 install -U --default-timeout=100 faster-whisper
RUN export FLASK_DEBUG=1
COPY api-faster.py ./
CMD [ "python", "./api-faster.py"]