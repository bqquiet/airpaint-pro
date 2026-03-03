# airpaint-pro
Air Canvas Desktop 🎨✨ — A professional real-time hand tracking and drawing application for desktop, built with React, Electron and MediaPipe.
# 🎨 Air Canvas Desktop

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-00BFFF?style=for-the-badge&logo=google&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

<div align="center">
  <img src="[https://via.placeholder.com/800x450/1a1a2e/ffffff?text=Air+Canvas+Desktop+AI+-+Screenshot](https://cdn.discordapp.com/attachments/1450146848475189412/1478378853192699954/image.png?ex=69a82f19&is=69a6dd99&hm=6b7ce075805ddd01d59983bdea3edfc27a94cad38bf69f0ddf91b55a30a24c40&)" alt="Air Canvas AI Demo Screenshot" width="800"/>
  <p><i>Приклад роботи застосунку: малювання в реальному часі за допомогою жестів рук.</i></p>
</div>

**Air Canvas Desktop** — це професійний десктопний застосунок, який дозволяє малювати в повітрі за допомогою жестів рук у реальному часі. Проєкт поєднує в собі потужність комп'ютерного зору (MediaPipe) для відстеження рухів, сучасний інтерфейс на React та десктопну архітектуру Electron.

---

## ✨ Ключові можливості

- **✋ Трекінг рук у реальному часі:** Високоточне відстеження рухів за допомогою MediaPipe (фіксація кінчика вказівного пальця).
- **🖌️ Малювання в повітрі (Air Canvas):** Перетворення жестів на цифрові малюнки на екрані.
- **💻 Кросплатформність:** Десктопний застосунок, упакований за допомогою Electron з безпечним управлінням дозволами на камеру.
- **⚡ Сучасний UI:** Побудований на React + Vite з використанням TailwindCSS та анімацій Framer Motion.

## 🛠 Технологічний стек

* **Frontend:** React 19, Vite, TailwindCSS, Lucide React, Motion.
* **Desktop:** Electron.
* **Computer Vision (Python & JS):** OpenCV, MediaPipe Hands.
* **Database:** Better-SQLite3.

## 🚀 Встановлення та запуск

Проєкт складається з Node.js (десктопний застосунок) та Python (модуль трекінгу) частин. 

### Попередні вимоги
- [Node.js](https://nodejs.org/) (рекомендовано v18+)
- [Python](https://www.python.org/) 3.10+
- Вебкамера

### 1. Налаштування Node.js (Electron + React) застосунку

Клонуй репозиторій та встанови залежності:

```bash
git clone [https://github.com/your-username/air-canvas-ai.git](https://github.com/your-username/air-canvas-ai.git)
cd airpaint-pro
npm install
