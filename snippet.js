(async function () {
    const styles = `
        .nt-weather-widget {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 6px;
            margin: 10px 0;
            overflow-x: auto;
        }

        .weather-forecast {
            display: flex;
            gap: 8px;
            min-width: min-content;
        }

        .forecast-day {
            background: white;
            padding: 8px;
            border-radius: 4px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            min-width: 120px;
            flex-shrink: 0;
        }

        .forecast-date {
            font-size: 12px;
            font-weight: 600;
            color: #2c5282;
            margin-bottom: 4px;
        }

        .temp-main {
            font-size: 14px;
            font-weight: bold;
            margin: 2px 0;
        }

        .weather-detail {
            font-size: 11px;
            line-height: 1.3;
            color: #4a5568;
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    //Funtion to return the details of the place and api
    function getDetails() {
        const mapLink = document.getElementById('propertyViewOnGoogleMaps').href
        const [latitude, longitude] = mapLink.split('destination=')[1].split('%2C')
        return {
            url: "https://europe-west1-amigo-actions.cloudfunctions.net/recruitment-mock-weather-endpoint/forecast",
            appId: "a2ef86c41a",
            placeName: document.querySelector('h1[class*="PlaceSummarystyle__Title"]').textContent || "Made-up's-vil",
            lat: latitude,
            lon: longitude,
            abTestEnabled: Math.random() < 0.5
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    // Function to fetch weather data
    async function fetchWeather({ url, appId, lat, lon }) {
        const fetchUrl = `${url}?appid=${appId}&lat=${lat}&lon=${lon}`;
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error("Failed to fetch weather data");
        return await response.json();
    }

    function groupForecastByDay(list) {
        const dailyForecasts = {};
        list.forEach(forecast => {
            const date = forecast.dt_txt.split(' ')[0];
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = forecast;
            }
        });
        return Object.values(dailyForecasts).slice(0, 7);
    }

    // Function to display the weather widget
    function displayWeatherData(weatherData, details) {
        const weatherWidget = document.createElement('div');
        weatherWidget.className = 'nt-weather-widget';

        const dailyForecasts = groupForecastByDay(weatherData.list);

        const forecastHTML = dailyForecasts.map(day => `
        <div class="forecast-day">
            <div class="forecast-date">${formatDate(day.dt_txt)}</div>
            <div class="temp-main">${day.main.temp.toFixed(1)}°C</div>
            <div class="weather-detail">${day.weather[0].main}</div>
            <div class="weather-detail">Feels: ${day.main.feels_like.toFixed(1)}°C</div>
            <div class="weather-detail">Wind: ${day.wind.speed.toFixed(1)} m/s</div>
            <div class="weather-detail">Vis: ${(day.visibility / 1000).toFixed(1)}km</div>
            ${day.rain ? `<div class="weather-detail">Rain: ${day.rain['3h']}mm</div>` : ''}
        </div >
        `).join('');

        weatherWidget.innerHTML = `
        <h4>Weather Forecast for ${details.placeName}</h4>
            <div class="weather-forecast">
                ${forecastHTML}
            </div>
    `;

        const insertPoint = document.querySelector('div[data-testid="place-summary-links"]');
        if (insertPoint) {
            insertPoint.insertAdjacentElement('afterend', weatherWidget)
        }
    }

    try {
        const details = getDetails();
        if (details.abTestEnabled > 0) return;
        const weatherData = await fetchWeather({ ...details });
        displayWeatherData(weatherData, details);
    } catch (error) {
        console.error("Error displaying weather widget:", error);
    }
})();