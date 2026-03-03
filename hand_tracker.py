import cv2
import mediapipe as mp
import time

class HandTracker:
    """
    Клас для відстеження рук за допомогою MediaPipe.
    """
    def __init__(self, mode=False, max_hands=2, detection_con=0.5, track_con=0.5):
        self.mode = mode
        self.max_hands = max_hands
        self.detection_con = detection_con
        self.track_con = track_con

        # Ініціалізація MediaPipe Hands
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=self.mode,
            max_num_hands=self.max_hands,
            min_detection_confidence=self.detection_con,
            min_tracking_confidence=self.track_con
        )
        self.mp_draw = mp.solutions.drawing_utils
        self.results = None

    def find_hands(self, img, draw=True):
        """
        Знаходить руки на зображенні та малює з'єднання.
        """
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        self.results = self.hands.process(img_rgb)

        if self.results.multi_hand_landmarks:
            for hand_lms in self.results.multi_hand_landmarks:
                if draw:
                    self.mp_draw.draw_landmarks(
                        img, hand_lms, self.mp_hands.HAND_CONNECTIONS
                    )
        return img

    def find_position(self, img, hand_no=0, draw=True):
        """
        Повертає список координат усіх точок (landmarks) для конкретної руки.
        """
        lm_list = []
        if self.results and self.results.multi_hand_landmarks:
            if hand_no < len(self.results.multi_hand_landmarks):
                my_hand = self.results.multi_hand_landmarks[hand_no]
                for id, lm in enumerate(my_hand.landmark):
                    h, w, c = img.shape
                    cx, cy = int(lm.x * w), int(lm.y * h)
                    lm_list.append([id, cx, cy])
                    if draw:
                        cv2.circle(img, (cx, cy), 5, (255, 0, 255), cv2.FILLED)
        return lm_list

def main():
    # Налаштування вебкамери
    cap = cv2.VideoCapture(0)
    
    # Перевірка, чи відкрилася камера
    if not cap.isOpened():
        print("Помилка: Не вдалося відкрити вебкамеру.")
        return

    tracker = HandTracker()
    p_time = 0
    c_time = 0

    print("Запуск трекінгу... Натисніть 'q' для виходу.")

    while True:
        success, img = cap.read()
        if not success:
            break

        # Знаходження рук
        img = tracker.find_hands(img)
        
        # Отримання координат точок
        lm_list = tracker.find_position(img, draw=False)

        if len(lm_list) != 0:
            # Landmark 8 - це кінчик вказівного пальця (Index Finger Tip)
            # Вивід координат у консоль
            print(f"Вказівний палець: X={lm_list[8][1]}, Y={lm_list[8][2]}")

        # Розрахунок FPS
        c_time = time.time()
        fps = 1 / (c_time - p_time)
        p_time = c_time

        # Відображення FPS на екрані
        cv2.putText(
            img, f"FPS: {int(fps)}", (10, 70), 
            cv2.FONT_HERSHEY_PLAIN, 3, (255, 0, 0), 3
        )

        # Показ вікна
        cv2.imshow("Hand Tracking", img)

        # Вихід при натисканні клавіші 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Звільнення ресурсів
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
