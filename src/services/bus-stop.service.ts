import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs';
import { BusStopData, SupabaseMeasurement } from '../models/bus-stop-data.model';

@Injectable({
  providedIn: 'root'
})
export class BusStopService {
  private http: HttpClient;

  private readonly SUPABASE_URL = "https://izrwdgnhpqdfmwhtrylt.supabase.co";
  private readonly SUPABASE_KEY = "sb_publishable_1cdquiCf2Vp2YA3MATaOOQ_l6Kwt0V5";
  private readonly SUPABASE_TABLE = "paradero_mediciones";

  constructor() {
    this.http = inject(HttpClient);
  }

  fetchBusStopData(count: number = 100): Observable<BusStopData[]> {
    const url = `${this.SUPABASE_URL}/rest/v1/${this.SUPABASE_TABLE}?select=*&order=timestamp.desc&limit=${count}`;

    const headers = new HttpHeaders({
      'apikey': this.SUPABASE_KEY,
      'Authorization': `Bearer ${this.SUPABASE_KEY}`
    });

    return this.http.get<SupabaseMeasurement[]>(url, { headers }).pipe(
      tap(data => {
        // Log raw data for easier debugging in the browser's developer console.
        console.log("Datos crudos recibidos de Supabase:", data);
        if (!Array.isArray(data)) {
          console.warn("La respuesta de Supabase no es un array. Verifique la API.", data);
        } else if (data.length === 0) {
          console.warn("Supabase devolvió una lista vacía. Verifique que la tabla tenga datos y que las políticas de seguridad (RLS) permitan la lectura.");
        }
      }),
      map(data => this.transformData(data)),
      catchError(this.handleError) // Add advanced error handling
    );
  }

  // Use an arrow function to preserve the `this` context for SUPABASE_TABLE.
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let userMessage = 'Ocurrió un error inesperado al contactar a Supabase. Revise la consola del navegador para más detalles.';
    
    if (error.status === 401 || error.status === 403) {
      userMessage = 'Error de autorización. Verifique que su API Key sea correcta y que la tabla tenga una política de lectura (RLS) para acceso público.';
    } else if (error.status === 404) {
      userMessage = `No se encontró la tabla '${this.SUPABASE_TABLE}'. Verifique que el nombre de la tabla sea correcto.`;
    }
    
    console.error('Error en la llamada a la API de Supabase:', error);
    // Propagate a user-friendly error message.
    return throwError(() => new Error(userMessage));
  }

  private transformData(data: SupabaseMeasurement[]): BusStopData[] {
    if (!Array.isArray(data)) {
      console.error("La respuesta de Supabase no fue un array y no se pudo transformar:", data);
      return [];
    }
    
    return data.map((item) => {
      let locationObject;
      try {
        if (item.location) {
          locationObject = typeof item.location === 'string' 
            ? JSON.parse(item.location) 
            : item.location;
          if (locationObject === null || typeof locationObject.lat !== 'number' || typeof locationObject.lng !== 'number') {
              locationObject = { lat: 0, lng: 0 };
          }
        } else {
           locationObject = { lat: 0, lng: 0 };
        }
      } catch (e) {
        console.error('Failed to parse location JSON:', item.location);
        locationObject = { lat: 0, lng: 0 };
      }

      return {
        id: item.id,
        stopId: `paradero-${String(item.id).padStart(3, '0')}`,
        timestamp: item.timestamp,
        location: locationObject,
        status: item.status,
        personCount: item.person_count,
        sensor1_distance: item.sensor1_distance,
        sensor2_distance: item.sensor2_distance,
        recommendation: item.recommendation
      };
    });
  }
}