import './style.css';

const API = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING = 'https://geocoding-api.open-meteo.com/v1/search';
const weatherCodes = { 0:['☀','Céu limpo'],1:['🌤','Predominantemente limpo'],2:['⛅','Parcialmente nublado'],3:['☁','Nublado'],45:['🌫','Neblina'],48:['🌫','Nevoeiro com geada'],51:['🌦','Garoa fraca'],53:['🌦','Garoa'],55:['🌧','Garoa forte'],61:['🌦','Chuva fraca'],63:['🌧','Chuva'],65:['🌧','Chuva forte'],71:['🌨','Neve fraca'],73:['❄','Neve'],75:['❄','Neve forte'],80:['🌦','Pancadas de chuva'],81:['🌧','Pancadas de chuva'],82:['⛈','Pancadas fortes'],95:['⛈','Trovoada'],96:['⛈','Trovoada com granizo'],99:['⛈','Trovoada com granizo'] };
const $ = (id) => document.getElementById(id);
const setText = (id, value) => { $(id).textContent = value; };

async function findCity(name) {
  const response = await fetch(`${GEOCODING}?name=${encodeURIComponent(name)}&count=1&language=pt&format=json`);
  if (!response.ok) throw new Error('Não foi possível buscar essa cidade.');
  const data = await response.json();
  if (!data.results?.length) throw new Error('Cidade não encontrada. Tente outra busca.');
  return data.results[0];
}
async function getWeather(place) {
  const params = new URLSearchParams({ latitude:place.latitude, longitude:place.longitude, timezone:'auto', forecast_days:7, current:'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m', daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' });
  const response = await fetch(`${API}?${params}`);
  if (!response.ok) throw new Error('Dados do clima temporariamente indisponíveis.');
  return response.json();
}
function icon(code) { return weatherCodes[code] || ['☁','Condição desconhecida']; }
function dayName(date, index) { return index === 0 ? 'Hoje' : new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR',{weekday:'short'}); }
function render(place, data) {
  const current = data.current, daily = data.daily, condition = icon(current.weather_code);
  $('weather-content').hidden = false; setText('location-name', `${place.name}${place.country_code ? `, ${place.country_code}` : ''}`); setText('updated-at', `Atualizado às ${new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}`); setText('local-time', new Date().toLocaleString('pt-BR', {weekday:'long', hour:'2-digit', minute:'2-digit'}));
  $('current-icon').textContent = condition[0]; setText('current-temp', Math.round(current.temperature_2m)); setText('current-summary', condition[1]); setText('today-high', Math.round(daily.temperature_2m_max[0])); setText('today-low', Math.round(daily.temperature_2m_min[0])); setText('humidity', `${current.relative_humidity_2m}%`); setText('wind', `${Math.round(current.wind_speed_10m)} km/h`); setText('feels-like', `${Math.round(current.apparent_temperature)}°`); setText('rain-chance', `${daily.precipitation_probability_max[0]}%`);
  $('forecast').innerHTML = daily.time.map((date, i) => { const c=icon(daily.weather_code[i]); return `<div class="forecast-day ${i===0?'today':''}"><span class="day">${dayName(date,i)}</span><span class="icon" aria-hidden="true">${c[0]}</span><strong>${Math.round(daily.temperature_2m_max[i])}° <span class="low">${Math.round(daily.temperature_2m_min[i])}°</span></strong><small>${c[1]}</small></div>`; }).join('');
}
async function load(place) { $('status').textContent='Carregando previsão…'; try { render(place, await getWeather(place)); $('status').textContent=''; } catch(error) { $('status').textContent=error.message; } }
$('search-form').addEventListener('submit', async (event) => { event.preventDefault(); const city=$('city-input').value.trim(); if (!city) return; try { await load(await findCity(city)); } catch(error) { $('status').textContent=error.message; } });
$('location-button').addEventListener('click', () => { if (!navigator.geolocation) { $('status').textContent='Geolocalização não é suportada por este navegador.'; return; } $('status').textContent='Buscando sua localização…'; navigator.geolocation.getCurrentPosition(async ({coords}) => { await load({latitude:coords.latitude, longitude:coords.longitude, name:'Sua localização'}); }, () => { $('status').textContent='Não foi possível acessar sua localização. Busque por uma cidade.'; }); });
load({ name:'São Paulo', country_code:'BR', latitude:-23.5505, longitude:-46.6333 });
