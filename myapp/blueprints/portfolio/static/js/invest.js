$(document).ready(function() {

    // Create deep copy of portfolio.assets so that we can add 'price' and 'change' attributes
    let assets = JSON.parse(JSON.stringify(portfolio.assets));
    assets.forEach(asset => {
        asset.price = 0;
        asset.change = 0;
    });

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    };

    function fetchStockPrices() {
        $.ajax({
            url: "get_stock_prices",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ assets: assets }),
            success: function(data) {
                assets.forEach(asset => {
                    if (data[asset.ticker]) {
                        asset.price = data[asset.ticker].price; // Update asset price
                        asset.change = data[asset.ticker].change; // Percentage change
                    }
                });
                populateTable();
            },
            error: function(error) {
                console.error("Error fetching stock prices:", error);
            }
        });
    }

    let selectedPeriod = "6m"; // Default period

    function fetchPortfolioReturns() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "get_portfolio_returns",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({ assets: assets, period: selectedPeriod }),
                success: function(data) {
                    if (data.dates && data.returns) {
                        renderReturnsChart(data.dates, data.returns); // Call chart update
                        resolve(); // Ensure the next function runs after this is done
                    } else {
                        console.error("Error fetching portfolio returns:", data);
                        reject(data);
                    }
                },
                error: function(xhr, status, error) {
                    console.error("Error fetching portfolio returns:", status, error);
                }
            });
        })
    }

    function fetchDailyPerformance() {
        $.ajax({
            url: "get_daily_performance",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ portfolio_name: portfolio.name }),
            success: function(data) {
                if (data.daily_return !== undefined) {

                    const dailyReturn = (data.daily_return * 100).toFixed(2); // Convert to percentage
                    
                    // Update card text
                    $("#dailyChange").text(`${dailyReturn}%`);

                    // Change color based on positive/negative return
                    if (dailyReturn > 0) {
                        $("#dailyChange").removeClass("text-danger").addClass("text-success");
                        $("#dailyChange").prepend("+");
                    } else {
                        $("#dailyChange").removeClass("text-success").addClass("text-danger");
                    }
                } else {
                    console.error("Error fetching daily performance:", data);
                }
            },
            error: function(xhr, status, error) {
                console.error("Error fetching daily performance:", status, error);
            }
        });
    }

    // Populate assets table
    function populateTable() {
        const tbody = $('#assetsTable tbody');
        tbody.empty();
        
        assets.forEach(asset => {
            if(asset.change>=0){
                tbody.append(`
                    <tr class="asset-row" data-asset-id="${asset.id}">
                        <td>${asset.ticker}</td>
                        <td class="text-end">${formatCurrency(asset.price)}</td>
                        <td class="text-end text-success">+${asset.change.toFixed(2)}%</td>
                        <td class="text-end">${asset.allocation.toFixed(2)}%</td>
                    </tr>
                `);
            }
            else{
                tbody.append(`
                    <tr class="asset-row" data-asset-id="${asset.id}">
                        <td>${asset.ticker}</td>
                        <td class="text-end">${formatCurrency(asset.price)}</td>
                        <td class="text-end text-danger">${asset.change.toFixed(2)}%</td>
                        <td class="text-end">${asset.allocation.toFixed(2)}%</td>
                    </tr>
                `);
            }
        });
    }

    // Initialize pie chart
    function initializePieChart() {
        const ctx = document.getElementById('pieChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: portfolio.assets.map(asset => asset.ticker),
                datasets: [{
                    data: portfolio.assets.map(asset => asset.allocation),
                    backgroundColor: [
                        '#6366f1',
                        '#22c55e',
                        '#eab308',
                        '#ef4444',
                        '#8b5cf6',
                        '#06b6d4',
                        '#f97316',
                        '#ec4899'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12
                            },
                            padding: 20
                        }
                    }
                }
            }
        });
    }

    let returnsChart;

    function renderReturnsChart(dates, returns) {
        const ctx = document.getElementById('returnsChart').getContext('2d');

        // Define colors for positive and negative returns
        const positiveLineColor = '#10b981';    // Green line
        const negativeLineColor = '#ef4444';    // Red line
        const positiveFillColor = 'rgba(16, 185, 129, 0.1)'; // Light green fill
        const negativeFillColor = 'rgba(239, 68, 68, 0.1)';  // Light red fill

        if (returnsChart) {
            returnsChart.data.labels = dates;
            returnsChart.data.datasets[0].data = returns.map(r => r * 100); // Convert to %
            returnsChart.update();
        } 
        else {
            returnsChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Portfolio Cumulative Return (%)',
                        data: returns.map(r => r * 100),
                        segment: {
                            borderColor: ctx => {
                                // Get the y value of the current data point
                                const yValue = ctx.p1.parsed.y;
                                // Return color based on whether value is above or below 0
                                return yValue >= 0 ? positiveLineColor : negativeLineColor;
                            }
                        },
                        fill: {
                            target: 'origin',
                            above: positiveFillColor,  // Area above the x-axis
                            below: negativeFillColor   // Area below the x-axis
                        },
                        tension: 0.4,
                        pointRadius: 0,
                        pointBackgroundColor: '#10b981'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Return: ${context.raw.toFixed(2)}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: { grid: { color: 'rgba(0, 0, 0, 0.05)' } },
                        y: { 
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: {
                                callback: function(value) {
                                    return value.toFixed(1) + '%';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    function drawRiskMeter(riskLevel) {
        const canvas = document.getElementById('riskMeterCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height + 5; // Move center below for semicircle
        const radius = width / 2 - 5;

        // Clear previous drawing
        ctx.clearRect(0, 0, width, height);

        // Define risk levels and colors
        const riskColors = {
            "Low": "#22c55e",      // Green
            "Moderate": "#eab308", // Yellow
            "High": "#ef4444"      // Red
        };

        // Define risk angles
        const riskAngles = {
            "Low": Math.PI * 1.2,         // Left side
            "Moderate": Math.PI * 1.5, // Middle
            "High": Math.PI * 1.8      // Right side
        };

        const color = riskColors[riskLevel] || "#eab308"; // Default to yellow
        const angle = riskAngles[riskLevel] || Math.PI * 1.5; // Default to middle

        // Draw background semicircle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
        ctx.lineWidth = 10;
        ctx.strokeStyle = "#ddd"; // Grey background
        ctx.stroke();

        // Draw active risk arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, angle);
        ctx.lineWidth = 10;
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    // Handle time period button clicks
    $('.period-btn').on('click', function() {
        $('.period-btn').removeClass('active'); // Remove active class from all buttons
        $(this).addClass('active'); // Highlight selected button
        selectedPeriod = $(this).data('period'); // Update selected period
        fetchPortfolioReturns(); // Fetch new data for the selected period
    });

    // Handle purchase units input
    $('#fundAmountInput').on('input', function() {
        const totalCost = parseFloat($("#fundAmountInput").val()) || 0;
        $('#totalCost').text(formatCurrency(totalCost));
    });

    // Handle add funds button click
    $("#addFundsBtn").on("click", function () {
        const fundAmount = parseFloat($("#fundAmountInput").val()) || 0;

        if (fundAmount <= 0) {
            alert("Please enter a valid amount to fund the portfolio.");
            return;
        }

        // Create portfolio object to send via AJAX
        const portfolioData = {
            portfolio: portfolio,  // Flask variable
            fund_amount: fundAmount
        };

        $.ajax({
            url: "add_portfolio",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(portfolioData),
            success: function (response) {
                if (response.status === "success") {
                    alert("Portfolio successfully added!");
                    $("#fundAmountInput").val("1000"); // Reset input
                } else {
                    alert("Error adding portfolio: " + response.message);
                }
            },
            error: function () {
                alert("An error occurred while adding the portfolio.");
            }
        });
    });

    // Initialise table and charts
    populateTable();
    initializePieChart();

    // Initial fetch
    fetchStockPrices();

    // Fetch portfolio returns first (historical data for the chart)
    fetchPortfolioReturns().then(() => {
        // Once returns data is loaded, fetch daily performance
        fetchDailyPerformance();
    });

    //Update risk meter
    drawRiskMeter(risk_level);

    // Refresh stock prices in table every minute
    setInterval(fetchStockPrices, 60000);

    // Refresh daily return every hour
    setInterval(fetchDailyPerformance, 3600000);

});