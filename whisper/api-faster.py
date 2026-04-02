from faster_whisper import WhisperModel
import os
from flask import Flask
from flask import request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

model_size = "small"

@app.route('/transcribe', methods=['POST'])
def transcribe():
    request.files['audio'].save("temp.wav")
    filesize = os.path.getsize("temp.wav")
    if(filesize < 100):
        return "Error: file size to tiny (Bytes " + str(filesize) + ")", 400
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    segments, info = model.transcribe("temp.wav", beam_size=5)

    print("Detected language '%s' with probability %f" % (info.language, info.language_probability))
    result = ""
    for segment in segments:
        result = result + segment.text 
        print("[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text))
    return result.replace('\n', ' ').replace('\r', ''), 200

app.run(host='0.0.0.0', port=5000)
