# 🌱 KhetSudhar

KhetSudhar is an **offline-first, gamified learning platform** designed to promote **sustainable farming practices** among young and smallholder farmers in India.
---

## 🚜 Problem Statement

Over half of India’s farmers are under the age of 35, yet existing learning systems fail to support them effectively.

Key challenges:
- Lack of accessible, continuous learning
- Advice-based solutions with low on-field adoption
- Low connectivity and literacy barriers
- Poor awareness of government schemes
- Monotonous and unengaging learning formats

These issues lead to **low adoption of sustainable farming practices**.

---

## 💡 Solution Overview

KhetSudhar addresses these challenges through:

- 🎮 **Game-based learning** for farming concepts
- 📱 **Offline-first mobile app** for rural usability
- 🌾 **Crop & region-specific learning paths**
- 🏆 **Rewards, leaderboards, and progress tracking**
- 📊 **Real mandi price data**
- 🧑‍🌾 **Inclusive design**, including women-centric modules

Learning is driven by **doing, not just reading or watching**.

---

## 🧩 Core Features

- **Gamified Lessons**  
  Interactive lessons combined with mini-games to teach sustainable practices.

- **Unity WebGL Mini-Games**  
  Original farming-based games embedded inside the app to reinforce concepts.

- **Offline-First Architecture**  
  Content and progress are cached locally and synced when internet is available.

- **Rewards & Motivation**  
  Points, leaderboards, and meaningful incentives to drive consistent usage.

- **Market Prices**  
  Real-time mandi price visibility to support informed decisions.

---

## 🎮 Mini-Games (This Repo / Related Repo)

KhetSudhar includes **Unity WebGL mini-games** that are embedded into the React Native app via WebView.

These games:
- Teach sustainable farming decisions
- Reinforce concepts learned in lessons
- Sync scores and progress with the backend

👉 A standalone mini-game demo is also available on **itch.io**  
(link added in the mini-game repository)

---

## 🛠️ Tech Stack

### Frontend
- React Native (Expo)
- TypeScript
- Figma (UI/UX Design)

### Backend
- Supabase
  - Authentication
  - PostgreSQL database
  - Edge Functions for custom logic

### Gamification
- Unity
- WebGL
- C#

### Architecture Highlights
- Offline-first using AsyncStorage
- Real-time sync when connectivity is restored
- Lightweight and optimized for low-end Android devices

---
