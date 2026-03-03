# Hand Tracking Project

This project uses OpenCV and MediaPipe to track hand landmarks in real-time via webcam.

## 🛠 Setup Instructions

1. **Install Python**: Ensure you have Python 3.10 or newer installed.
2. **Install Dependencies**: Open your terminal in this folder and run:
   ```bash
   pip install -r requirements.txt
   ```
3. **Run the Script**:
   ```bash
   python hand_tracker.py
   ```

## 🎮 Controls
- **'q'**: Press 'q' while the camera window is active to quit.
- **Console**: Watch the terminal to see real-time X/Y coordinates of your index finger.

## 📁 Project Structure
- `hand_tracker.py`: Main logic and `HandTracker` class.
- `requirements.txt`: Required Python libraries.
