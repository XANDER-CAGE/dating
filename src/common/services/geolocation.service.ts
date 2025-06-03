import { Injectable } from '@nestjs/common';
import { distance as turfDistance } from '@turf/distance';
import { point as turfPoint } from '@turf/turf';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface LocationInfo {
  coordinates: Coordinates;
  city?: string;
  country?: string;
  accuracy?: number;
}

export interface DistanceResult {
  distance: number; // в километрах
  unit: 'km';
}

export interface NearbySearchParams {
  center: Coordinates;
  radius: number; // в километрах
  limit?: number;
  offset?: number;
}

@Injectable()
export class GeolocationService {
  
  /**
   * Конвертирует широту и долготу в PostGIS Point
   */
  coordinatesToPoint(coordinates: Coordinates): LocationPoint {
    return {
      type: 'Point',
      coordinates: [coordinates.longitude, coordinates.latitude],
    };
  }

  /**
   * Конвертирует PostGIS Point в координаты
   */
  pointToCoordinates(point: LocationPoint): Coordinates {
    return {
      longitude: point.coordinates[0],
      latitude: point.coordinates[1],
    };
  }

  /**
   * Вычисляет расстояние между двумя точками
   */
  calculateDistance(from: Coordinates, to: Coordinates): DistanceResult {
    const fromPoint = turfPoint([from.longitude, from.latitude]);
    const toPoint = turfPoint([to.longitude, to.latitude]);
    
    const distance = turfDistance(fromPoint, toPoint, { units: 'kilometers' });
    
    return {
      distance: Math.round(distance * 100) / 100, // округляем до 2 знаков
      unit: 'km',
    };
  }

  /**
   * Проверяет, находится ли точка в пределах радиуса
   */
  isWithinRadius(center: Coordinates, point: Coordinates, radiusKm: number): boolean {
    const result = this.calculateDistance(center, point);
    return result.distance <= radiusKm;
  }

  /**
   * Создает SQL запрос для поиска по расстоянию (PostGIS)
   */
  buildDistanceQuery(center: Coordinates, radiusKm: number): {
    where: string;
    parameters: any;
  } {
    return {
      where: `ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
        :radius
      )`,
      parameters: {
        longitude: center.longitude,
        latitude: center.latitude,
        radius: radiusKm * 1000, // конвертируем км в метры
      },
    };
  }

  /**
   * Создает SQL для получения расстояния в запросе
   */
  buildDistanceSelectQuery(center: Coordinates): {
    select: string;
    parameters: any;
  } {
    return {
      select: `ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
      ) / 1000 as distance`, // в километрах
      parameters: {
        longitude: center.longitude,
        latitude: center.latitude,
      },
    };
  }

  /**
   * Валидирует координаты
   */
  validateCoordinates(coordinates: Coordinates): boolean {
    const { latitude, longitude } = coordinates;
    
    // Проверяем диапазоны
    if (latitude < -90 || latitude > 90) return false;
    if (longitude < -180 || longitude > 180) return false;
    
    // Проверяем, что это числа
    if (isNaN(latitude) || isNaN(longitude)) return false;
    
    return true;
  }

  /**
   * Получает информацию о городе по координатам (заглушка для будущей интеграции)
   */
  async getCityByCoordinates(coordinates: Coordinates): Promise<{
    city?: string;
    country?: string;
  }> {
    // TODO: Интегрировать с сервисом геокодирования (Google Maps, OpenStreetMap)
    // Пока возвращаем заглушку
    return {
      city: 'Unknown City',
      country: 'Unknown Country',
    };
  }

  /**
   * Форматирует расстояние для отображения
   */
  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} м`;
    } else if (distanceKm < 10) {
      return `${Math.round(distanceKm * 10) / 10} км`;
    } else {
      return `${Math.round(distanceKm)} км`;
    }
  }

  /**
   * Создает область поиска (bounding box) для оптимизации запросов
   */
  createBoundingBox(center: Coordinates, radiusKm: number): {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } {
    // Приблизительные расчеты (1 градус ≈ 111 км)
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(center.latitude * Math.PI / 180));

    return {
      minLat: center.latitude - latDelta,
      maxLat: center.latitude + latDelta,
      minLng: center.longitude - lngDelta,
      maxLng: center.longitude + lngDelta,
    };
  }

  /**
   * Группирует результаты по расстоянию
   */
  groupByDistance(results: Array<{ distance: number; [key: string]: any }>): {
    nearby: any[]; // < 5 км
    close: any[];  // 5-25 км
    far: any[];    // > 25 км
  } {
    return results.reduce(
      (groups, item) => {
        if (item.distance < 5) {
          groups.nearby.push(item);
        } else if (item.distance < 25) {
          groups.close.push(item);
        } else {
          groups.far.push(item);
        }
        return groups;
      },
      { nearby: [], close: [], far: [] }
    );
  }

  /**
   * Рассчитывает центр масс для группы точек
   */
  calculateCentroid(points: Coordinates[]): Coordinates | null {
    if (points.length === 0) return null;

    const sum = points.reduce(
      (acc, point) => ({
        latitude: acc.latitude + point.latitude,
        longitude: acc.longitude + point.longitude,
      }),
      { latitude: 0, longitude: 0 }
    );

    return {
      latitude: sum.latitude / points.length,
      longitude: sum.longitude / points.length,
    };
  }
}