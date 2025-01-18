$(document).ready(function() {

    function renderPortfolios() {
        const container = $('#portfolio-container');
        container.empty();

        const getRiskClass = (type) => {
            const risk = type.split(' ')[0].toLowerCase();
            return `risk-${risk}`;
        };

        const renderLabels = (labels) => {
            return labels.map(label => {
                const className = label.type === 'risk' 
                    ? `portfolio-type ${getRiskClass(label.text)}` 
                    : 'label';
                return `<span class="${className}">${label.text}</span>`;
            }).join('');
        };

        portfolios.forEach(portfolio => {

            // Create id for 'View details' button so that we can refer to it later
            const button_id = portfolio.name.replace(/\s+/g, '-');

            const card = `
                <div class="portfolio-card">
                    <div class="card-header">
                        <h3 class="portfolio-name">${portfolio.name}</h3>
                    </div>
                    
                    <div class="card-body">
                        <div class="portfolio-stats">
                            <div class="labels-container">
                                ${renderLabels(portfolio.labels)}
                            </div>
                            <div class="return-info">
                                <div class="return-value">${portfolio.returns.oneYear}%</div>
                                <div class="return-label">Annual Return</div>
                            </div>
                        </div>
                        <p class="portfolio-description">${portfolio.short_description}</p>
                    </div>
                    
                    <div class="card-footer">
                        <button id=${button_id} class="btn btn-outline-primary open-modal" data-bs-toggle="modal" data-bs-target="#portfolioModal">View Details</button>
                        <button class="btn btn-primary">Invest Now</button>
                    </div>
                </div>
            `;

            container.append(card);

            // Add portfolio data to the button so that we can pass the data to our modal later
            $('#'+button_id).data('portfolio', portfolio);
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
            const type = $(this).find('.labels-container span').map(function() {
                return $(this).text().toLowerCase();
            }).get();
        
            //const type = $(this).find('.portfolio-type').text().toLowerCase();
            $(this).toggle(filterValue === 'all' || type.includes(filterValue));
        });
    });

    // Update modal content dynamically
    $('.open-modal').on('click', function () {

        const portfolio = $(this).data('portfolio');

        $('#modalTitle').text(portfolio.name);
        $("#oneYearReturn").text(portfolio.returns.oneYear.toFixed(1) + "%");
        $("#threeYearReturn").text(portfolio.returns.threeYear.toFixed(1) + "%");
        $("#fiveYearReturn").text(portfolio.returns.fiveYear.toFixed(1) + "%");

        // Clear list before appending new elements to list
        $('#modalDescription').empty();
        
        portfolio.long_description.forEach((item)=>
            $('#modalDescription').append(`<li>${item}</li>`)
        );

        // Create chart and populate returns when modal is shown
        createAllocationChart(portfolio);
        
    });

    function createAllocationChart(portfolio) {
        let chartStatus = Chart.getChart("allocationChart");

        if(chartStatus != undefined){
            chartStatus.destroy();
        }

        const ctx = document.getElementById('allocationChart').getContext("2d");
        new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: portfolio.allocation.map(item => item.name),
                datasets: [{
                    data: portfolio.allocation.map(item => item.value),
                    backgroundColor: [
                        "#3a0ca3", "#f72585", "#4361ee", "#9d5ee6", "#715EE6", "#5EA2E6", "#C95EE6", "#B3ABE6"
                        //"#4361ee", "#3a0ca3", "#7209b7", "#f72585", "#4cc9f0"
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

});