/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL des Preisproxys (fare-proxy), z. B. https://plan-b-fare-proxy.<konto>.workers.dev */
  readonly VITE_FARE_API_URL?: string;
}
