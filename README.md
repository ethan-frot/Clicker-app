# 🎮 Clicker - Le jeu de compétition en équipe

## 📱 Présentation

Clicker est une application mobile développée avec React Native et Expo qui propose une expérience de jeu compétitive en temps réel. Les joueurs peuvent rejoindre l'équipe bleue ou rouge et participer à une bataille de clics pour faire gagner leur équipe !

## ⚙️ Installation

1. Clonez le dépôt :

```bash
git clone https://github.com/ethan-frot/Clicker-app
```

2. Installez les dépendances :

```bash
npm install
```

3. Configurez les variables d'environnement :

```bash
# Copiez le fichier d'exemple
cp .env-example .env

# Modifiez le fichier .env avec vos clés Firebase
```

4. Lancez l'application :

```bash
npx expo start
```

## 🔧 Configuration Firebase

### Création du projet Firebase

1. Créez un nouveau projet sur [Firebase Console](https://console.firebase.google.com/)
2. Activez Firestore Database dans votre projet
3. Configurez les règles de sécurité de Firestore

### Structure de la base de données

La base de données Firestore doit contenir les collections suivantes :

- `users` : Stocke les informations des utilisateurs

- `scores` : Stocke les scores des équipes

- `interactions` : Stocke les interactions des utilisateurs

Vous pouvez trouver ces informations dans les paramètres de votre projet Firebase.

## ✨ Fonctionnalités principales

- 🔵 🔴 Choix entre deux équipes : Bleue ou Rouge
- 👆 Interface de clic intuitive et réactive
- 📊 Barre de progression en temps réel montrant la domination des équipes
- 🏆 Système de score individuel et par équipe
- 🎨 Design moderne avec thème sombre
- 🔄 Synchronisation en temps réel avec Firebase
- 📱 Interface utilisateur adaptative et responsive

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.
