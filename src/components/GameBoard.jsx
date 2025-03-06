import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Volume2, VolumeX, Info, Moon, Sun } from 'lucide-react';

// Game constants
const BOARD_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const FOOD_POINTS = 10;
const BIG_FOOD_POINTS = 20;
const FOODS_FOR_BIG = 6;
const SPEED_LEVELS = {
  easy: 200,
  medium: 150,
  hard: 100
};

// Generate random position within board limits
const getRandomPosition = () => ({
  x: Math.floor(Math.random() * BOARD_SIZE),
  y: Math.floor(Math.random() * BOARD_SIZE)
});

// Sound effects using reliable CDN-hosted audio files
const eatSound = new Audio('https://cdn.freesound.org/previews/566/566435_12494556-lq.mp3');
const crashSound = new Audio('https://cdn.freesound.org/previews/562/562060_7107243-lq.mp3');
const beepSound = new Audio('https://cdn.freesound.org/previews/320/320181_5260872-lq.mp3');

// Preload audio files
eatSound.load();
crashSound.load();
beepSound.load();

export default function GameBoard() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ ...getRandomPosition(), isBig: false });
  const [obstacles, setObstacles] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [foodEatenCount, setFoodEatenCount] = useState(0);
  const [highScore, setHighScore] = useState(
    parseInt(localStorage.getItem('snakeHighScore') || '0')
  );
  const [isPaused, setIsPaused] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize obstacles
  useEffect(() => {
    const newObstacles = [];
    for (let i = 0; i < 5; i++) {
      let position;
      do {
        position = getRandomPosition();
      } while (
        snake.some(segment => segment.x === position.x && segment.y === position.y) ||
        (food.x === position.x && food.y === position.y) ||
        newObstacles.some(obs => obs.x === position.x && obs.y === position.y)
      );
      newObstacles.push(position);
    }
    setObstacles(newObstacles);
  }, []);

  // Handle keyboard controls
  const handleKeyPress = useCallback((e) => {
    if (gameOver) return;

    const keyDirections = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }
    };

    if (keyDirections[e.key]) {
      const newDirection = keyDirections[e.key];
      // Prevent 180-degree turns
      if (
        (direction.x !== -newDirection.x || direction.x === 0) &&
        (direction.y !== -newDirection.y || direction.y === 0)
      ) {
        setDirection(newDirection);
      }
    }

    // Pause game with spacebar
    if (e.code === 'Space') {
      setIsPaused(prev => !prev);
    }

    // Close info modal with Escape
    if (e.code === 'Escape') {
      setShowInfo(false);
    }
  }, [direction, gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Game loop
  useEffect(() => {
    if (gameOver || isPaused || showInfo) return;

    const moveSnake = () => {
      const newSnake = [...snake];
      const head = {
        x: (newSnake[0].x + direction.x + BOARD_SIZE) % BOARD_SIZE,
        y: (newSnake[0].y + direction.y + BOARD_SIZE) % BOARD_SIZE
      };

      // Check collision with self or obstacles
      if (
        newSnake.some(segment => segment.x === head.x && segment.y === head.y) ||
        obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)
      ) {
        if (isSoundEnabled) {
          crashSound.currentTime = 0;
          crashSound.play().catch(() => {});
        }
        setGameOver(true);
        return;
      }

      newSnake.unshift(head);

      // Check if food is eaten
      if (head.x === food.x && head.y === food.y) {
        if (isSoundEnabled) {
          if (food.isBig) {
            beepSound.currentTime = 0;
            beepSound.play().catch(() => {});
          } else {
            eatSound.currentTime = 0;
            eatSound.play().catch(() => {});
          }
        }

        const points = food.isBig ? BIG_FOOD_POINTS : FOOD_POINTS;
        setScore(prev => {
          const newScore = prev + points;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('snakeHighScore', newScore.toString());
          }
          return newScore;
        });

        setFoodEatenCount(prev => prev + 1);

        // Generate new food position
        let newFood;
        do {
          newFood = {
            ...getRandomPosition(),
            isBig: (foodEatenCount + 1) % FOODS_FOR_BIG === 0
          };
        } while (
          newSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
          obstacles.some(obstacle => obstacle.x === newFood.x && obstacle.y === newFood.y)
        );
        setFood(newFood);
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
    };

    const gameInterval = setInterval(moveSnake, SPEED_LEVELS[difficulty]);
    return () => clearInterval(gameInterval);
  }, [snake, direction, food, gameOver, isPaused, difficulty, foodEatenCount, showInfo]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood({ ...getRandomPosition(), isBig: false });
    setGameOver(false);
    setScore(0);
    setFoodEatenCount(0);
    setIsPaused(false);
  };

  const bgColor = isDarkMode ? 'bg-gray-900' : 'bg-gray-100';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const navBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const boardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`min-h-screen ${bgColor} transition-colors duration-300`}>
      {/* Navbar */}
      <nav className={`${navBg} ${borderColor} border-b shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className={`text-2xl font-bold ${textColor}`}>🐍 Snake Game</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className={`p-2 rounded-full hover:bg-opacity-10 hover:bg-gray-500 ${textColor} transition-colors`}
                title={isSoundEnabled ? "Mute" : "Unmute"}
              >
                {isSoundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
              </button>
              <button
                onClick={() => setShowInfo(true)}
                className={`p-2 rounded-full hover:bg-opacity-10 hover:bg-gray-500 ${textColor} transition-colors`}
                title="Game Info"
              >
                <Info size={24} />
              </button>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-full hover:bg-opacity-10 hover:bg-gray-500 ${textColor} transition-colors`}
                title={isDarkMode ? "Light Mode" : "Dark Mode"}
              >
                {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
              </button>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className={`${navBg} ${textColor} rounded-lg px-3 py-2 border ${borderColor} focus:outline-none focus:ring-2 focus:ring-green-500`}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-col items-center justify-center p-4 mt-8">
        {/* Score Display */}
        <div className={`mb-4 w-full max-w-lg ${boardBg} p-4 rounded-xl shadow-lg ${borderColor} border`}>
          <div className={`${textColor}`}>
            <p className="text-2xl font-bold">Score: {score}</p>
            <p className="text-sm opacity-75">High Score: {highScore}</p>
            <p className="text-xs opacity-60 mt-1">Next big food in: {FOODS_FOR_BIG - (foodEatenCount % FOODS_FOR_BIG)} foods</p>
          </div>
        </div>

        {/* Game Board */}
        <div className={`relative w-[500px] h-[500px] ${boardBg} rounded-2xl overflow-hidden shadow-2xl border ${borderColor}`}>
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
            }}
          >
            {/* Snake */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              const isTail = index === snake.length - 1;
              return (
                <div
                  key={`${segment.x}-${segment.y}`}
                  className={`
                    ${isHead ? 'bg-green-400' : 'bg-green-500'} 
                    ${isHead ? 'rounded-full' : isTail ? 'rounded-full' : 'rounded-sm'}
                    m-[1px] transition-colors duration-200
                    ${isHead ? 'shadow-lg' : ''}
                  `}
                  style={{
                    gridColumn: segment.x + 1,
                    gridRow: segment.y + 1,
                  }}
                />
              );
            })}

            {/* Food */}
            <div
              className={`
                ${food.isBig ? 'bg-purple-500 animate-pulse' : 'bg-red-500'}
                rounded-full m-[2px] shadow-lg
                ${food.isBig ? 'scale-150' : ''}
              `}
              style={{
                gridColumn: food.x + 1,
                gridRow: food.y + 1,
              }}
            />

            {/* Obstacles */}
            {obstacles.map((obstacle, index) => (
              <div
                key={`obstacle-${index}`}
                className={`bg-gray-600 rounded-sm border ${borderColor}`}
                style={{
                  gridColumn: obstacle.x + 1,
                  gridRow: obstacle.y + 1,
                }}
              />
            ))}
          </div>

          {/* Game Over overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center">
              <div className={`text-center ${boardBg} p-8 rounded-2xl shadow-2xl border ${borderColor}`}>
                <h2 className="text-4xl text-red-500 font-bold mb-4">Game Over!</h2>
                <p className={`text-2xl ${textColor} mb-2`}>Final Score: {score}</p>
                <p className={`text-sm opacity-75 ${textColor} mb-6`}>High Score: {highScore}</p>
                <button
                  onClick={resetGame}
                  className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold text-lg"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}

          {/* Pause overlay */}
          {isPaused && !gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-4xl text-white font-bold">PAUSED</div>
            </div>
          )}
        </div>

        {/* Info Modal */}
        {showInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`${boardBg} p-8 rounded-2xl shadow-2xl border ${borderColor} max-w-lg w-full mx-4`}>
              <h2 className={`text-2xl font-bold ${textColor} mb-4`}>How to Play</h2>
              <div className={`space-y-3 ${textColor}`}>
                <p className="flex items-center gap-2">
                  <span className="bg-green-500 w-4 h-4 rounded-full"></span>
                  Use arrow keys to control the snake
                </p>
                <p className="flex items-center gap-2">
                  <span className="bg-red-500 w-4 h-4 rounded-full"></span>
                  Collect regular food for 10 points
                </p>
                <p className="flex items-center gap-2">
                  <span className="bg-purple-500 w-4 h-4 rounded-full"></span>
                  Special purple food appears every 6 regular foods - worth 20 points!
                </p>
                <p className="flex items-center gap-2">
                  <span className="bg-gray-600 w-4 h-4"></span>
                  Avoid obstacles and don't hit yourself
                </p>
                <p className="flex items-center gap-2">⌨️ Press Space to pause/resume</p>
                <p className="flex items-center gap-2">❌ Press Escape to close this window</p>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium w-full"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className={`text-center ${textColor} opacity-75 py-4`}>
        <p>Created by <span className="font-semibold">Masab Qurban</span> © {new Date().getFullYear()} All Rights Reserved</p>
      </footer>
    </div>
  );
}