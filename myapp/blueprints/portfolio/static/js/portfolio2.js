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
                oneYear: 15.7,
                threeYear: 42.3,
                fiveYear: 76.9
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

    function renderPortfolios() {
        const container = $('#portfolio-container');
        container.empty();

        const getRiskClass = (type) => {
            const risk = type.split(' ')[0].toLowerCase();
            return `risk-${risk}`;
        };

        portfolios.forEach(portfolio => {
            const card = `
                <div class="portfolio-card">
                    <div class="card-header">
                        <h3 class="portfolio-name">${portfolio.name}</h3>
                    </div>
                    
                    <div class="card-body">
                        <div class="portfolio-stats">
                            <span class="portfolio-type ${getRiskClass(portfolio.type)}">${portfolio.type}</span>
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

    // Create chart and populate returns when modal is shown
    $("#portfolioModal").on("shown.bs.modal", function() {
        createAllocationChart(portfolios[0]);
        populateReturns(portfolios[0]);
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

    function populateReturns(portfolio) {
        $("#oneYearReturn").text(portfolio.returns.oneYear.toFixed(1) + "%");
        $("#threeYearReturn").text(portfolio.returns.threeYear.toFixed(1) + "%");
        $("#fiveYearReturn").text(portfolio.returns.fiveYear.toFixed(1) + "%");
    }
});