$(document).ready(function() {
    const portfolios = [
        {
            name: "Growth Portfolio",
            type: "High Risk",
            description: "Aggressive growth strategy focused on emerging markets and tech sectors",
            return: "12.5%",
            allocation: [
                { name: "Technology", value: 40 },
                { name: "Healthcare", value: 25 },
                { name: "Consumer Discretionary", value: 20 },
                { name: "Financials", value: 10 },
                { name: "Others", value: 5 },
            ],
            returns: {
                "6m": [
                    { month: "Jan", value: 5.2 },
                    { month: "Feb", value: 3.8 },
                    { month: "Mar", value: -2.1 },
                    { month: "Apr", value: 4.5 },
                    { month: "May", value: 6.3 },
                    { month: "Jun", value: 1.9 },
                ],
                "1y": [
                    { month: "Jul", value: 2.1 },
                    { month: "Aug", value: 3.5 },
                    { month: "Sep", value: -1.2 },
                    { month: "Oct", value: 4.8 },
                    { month: "Nov", value: 5.6 },
                    { month: "Dec", value: 2.3 },
                    { month: "Jan", value: 5.2 },
                    { month: "Feb", value: 3.8 },
                    { month: "Mar", value: -2.1 },
                    { month: "Apr", value: 4.5 },
                    { month: "May", value: 6.3 },
                    { month: "Jun", value: 1.9 },
                ],
                "3y": [
                    { year: "2021", value: 22.4 },
                    { year: "2022", value: -15.6 },
                    { year: "2023", value: 18.7 },
                ],
                "5y": [
                    { year: "2019", value: 28.9 },
                    { year: "2020", value: 16.3 },
                    { year: "2021", value: 22.4 },
                    { year: "2022", value: -15.6 },
                    { year: "2023", value: 18.7 },
                ]
            }
        },
        {
            name: "Balanced Fund",
            type: "Medium Risk",
            description: "Diversified mix of stocks and bonds for steady growth",
            return: "8.2%"
        },
        {
            name: "Conservative Income",
            type: "Low Risk",
            description: "Focus on stable dividend-paying stocks and government bonds",
            return: "5.7%"
        }
    ];

    let returnsChart;

    function renderPortfolios() {
        const container = $('#portfolio-container');
        container.empty();

        portfolios.forEach(portfolio => {
            const card = `
                <div class="portfolio-card">
                    <div class="card-header">
                        <h3 class="portfolio-name">${portfolio.name}</h3>
                    </div>
                    
                    <div class="card-body">
                        <div class="portfolio-stats">
                            <span class="portfolio-type">${portfolio.type}</span>
                            <div class="return-info">
                                <div class="return-value">${portfolio.return}</div>
                                <div class="return-label">Annual Return</div>
                            </div>
                        </div>
                        <p class="portfolio-description">${portfolio.description}</p>
                    </div>
                    
                    <div class="card-footer">
                        <button id="viewPortfolioBtn" class="btn btn-outline-primary">View Details</button>
                        <button class="btn btn-primary">Invest Now</button>
                    </div>
                </div>
            `;
            container.append(card);
        });
    }

    renderPortfolios();

    $('input[type="text"]').on('keyup', function() {
        const searchTerm = $(this).val().toLowerCase();
        $('.portfolio-card').each(function() {
            const text = $(this).find('.card-header').text().toLowerCase();
            $(this).toggle(text.includes(searchTerm));
        });
    });

    $('select').on('change', function() {
        const filterValue = $(this).val().toLowerCase();
        $('.portfolio-card').each(function() {
            const type = $(this).find('.portfolio-type').text().toLowerCase();
            $(this).toggle(!filterValue || type.includes(filterValue));
        });
    });

     // Open modal on button click
    $("#viewPortfolioBtn").click(function() {
        $("#portfolioModal").modal("show");
    });

    // Create charts when modal is shown
    $("#portfolioModal").on("shown.bs.modal", function() {
        createAllocationChart(portfolios[0]);
        createReturnsChart(portfolios[0], "6m");
    });

    // Handle time period button clicks
    $(".btn-group .btn").click(function() {
        $(".btn-group .btn").removeClass("active");
        $(this).addClass("active");
        updateReturnsChart(portfolios[0], $(this).data("period"));
    });

    function createAllocationChart(portfolio) {
        const ctx = document.getElementById("allocationChart").getContext("2d");
        new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: portfolio.allocation.map(item => item.name),
                datasets: [{
                    data: portfolio.allocation.map(item => item.value),
                    backgroundColor: [
                        "#4361ee", "#3a0ca3", "#7209b7", "#f72585", "#4cc9f0"
                    ],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "right",
                        labels: {
                            boxWidth: 12,
                            padding: 10
                        }
                    },
                    title: {
                        display: false,
                    }
                },
                layout: {
                    padding: 10
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    }

    function createReturnsChart(portfolio, period) {
        const ctx = document.getElementById("returnsChart").getContext("2d");
        const data = portfolio.returns[period];
        const labels = data.map(item => item.month || item.year);
        const values = data.map(item => item.value);

        returnsChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: `Returns (${period})`,
                    data: values,
                    borderColor: "#10b981",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Returns (%)"
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    title: {
                        display: false,
                    },
                    legend: {
                        display: false,
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    function updateReturnsChart(portfolio, period) {
        const data = portfolio.returns[period];
        const labels = data.map(item => item.month || item.year);
        const values = data.map(item => item.value);

        returnsChart.data.labels = labels;
        returnsChart.data.datasets[0].data = values;
        returnsChart.data.datasets[0].label = `Returns (${period})`;
        returnsChart.update();
    }
});