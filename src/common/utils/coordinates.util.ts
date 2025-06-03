export class CoordinatesUtil {
    /**
     * Генерирует случайные координаты в пределах города (для тестирования)
     */
    static generateRandomCoordinatesInCity(centerLat: number, centerLng: number, radiusKm: number = 10) {
      const radiusDeg = radiusKm / 111; // Приблизительно км в градусы
      
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radiusDeg;
      
      return {
        latitude: centerLat + (distance * Math.cos(angle)),
        longitude: centerLng + (distance * Math.sin(angle)),
      };
    }
  
    /**
     * Генерирует тестовые координаты для разных городов
     */
    static getTestCoordinates() {
      return {
        moscow: { latitude: 55.7558, longitude: 37.6176 },
        spb: { latitude: 59.9311, longitude: 30.3609 },
        london: { latitude: 51.5074, longitude: -0.1278 },
        paris: { latitude: 48.8566, longitude: 2.3522 },
        newYork: { latitude: 40.7128, longitude: -74.0060 },
        tokyo: { latitude: 35.6762, longitude: 139.6503 },
      };
    }
  
    /**
     * Проверяет, находятся ли координаты в пределах России
     */
    static isInRussia(latitude: number, longitude: number): boolean {
      // Упрощенная проверка границ России
      return latitude >= 41 && latitude <= 82 && longitude >= 19 && longitude <= 170;
    }
  
    /**
     * Получает часовой пояс по координатам (заглушка)
     */
    static getTimezoneOffset(latitude: number, longitude: number): number {
      // TODO: Интегрировать с реальным API для определения часового пояса
      // Пока возвращаем MSK (+3)
      return 3;
    }
  }