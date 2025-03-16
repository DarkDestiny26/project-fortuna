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

        // Display portfolios in ascending order of 'id'
        portfolios.sort((a, b) => a.id - b.id).forEach(portfolio => {

            const id = portfolio.name.replace(/\s+/g, '-');

            // Create id for 'View details' button so that we can refer to it later
            const view_details_id = id + "-details";

            // Create id for 'Invest now' button so that we can refer to it later
            const invest_now_id = id + "-invest";

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
                                <div class="return-value">${portfolio.annual_returns.oneYear}%</div>
                                <div class="return-label">Annual Return</div>
                            </div>
                        </div>
                        <p class="portfolio-description">${portfolio.short_description}</p>
                    </div>
                    
                    <div class="card-footer">
                        <button id=${view_details_id} class="btn btn-outline-primary open-modal" data-bs-toggle="modal" data-bs-target="#portfolioModal">View Details</button>
                        <form action="/home/portfolio/invest" method="post">
                            <input id=${invest_now_id} type="hidden" name="portfolio" value="">
                            <button class="btn btn-primary" type="submit">Invest Now</button>
                        </form>
                    </div>
                </div>
            `;

            container.append(card);

            // Add portfolio data to 'view details' button so that we can pass the data to our modal later
            $('#'+view_details_id).data('portfolio', portfolio);

            // Add portfolio data to 'invest now' input so that we can pass the data to /invest route
            $('#'+invest_now_id).val(JSON.stringify(portfolio));

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

    $('#recommendBtn').on('click', ()=>{
        $('#aiPortfolioModal').modal("show");
        $.ajax({
            url: "get_recommended_portfolios",  
            type: "POST",
            dataType: "json",
            success: function (response) {
                // Create report with LLM response
                const formattedDate = new Date().toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric' });
                $('#aiPortfolioModalDate').text("Generated on " + formattedDate);
                $("#aiPortfolioModal .modal-body").html(generateModalContent(response));
                $("#loadingOverlay").css("visibility", "hidden"); // Hide loading screen
                $('#aiPortfolioModal').on('hidden.bs.modal', ()=>{
                    $("#loadingOverlay").css("visibility", "visible"); // Show loading screen when modal is opened again
                });
            },
            error: (xhr, status, error)=> {
                console.error("AJAX Error:", status, error);
                console.error("Response Text:", xhr.responseText);
                alert(`${xhr.responseText}`);
                $("#aiPortfolioModal").modal('hide');
            }

        });
    });

    // Update modal card content dynamically
    $('.open-modal').on('click', function () {

        const portfolio = $(this).data('portfolio');

        $('#modalTitle').text(portfolio.name);
        $("#oneYearReturn").text(portfolio.annual_returns.oneYear.toFixed(1) + "%");
        $("#threeYearReturn").text(portfolio.annual_returns.threeYear.toFixed(1) + "%");
        $("#fiveYearReturn").text(portfolio.annual_returns.fiveYear.toFixed(1) + "%");

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
                labels: portfolio.assets.map(item => item.name),
                datasets: [{
                    data: portfolio.assets.map(item => item.allocation),
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

    function generateModalContent(response){
        // Convert response data into a dictionary for quick lookup
        const responsePortfolioMap = Object.fromEntries(
            response.portfolios.map(p => [p.name, p.reasons])
        );

        // Filter and map filteredPortfolios to only include those in the response object
        filteredPortfolios = portfolios.filter(portfolio => responsePortfolioMap[portfolio.name]) // Keep only matching portfolios
                            .map(portfolio => ({
                                ...portfolio,
                                reasons: responsePortfolioMap[portfolio.name] // Assign reasons
                            }));

        console.log(filteredPortfolios);

        return modalBodyHtml = `
        <div class="intro-text mb-4">
            ${response.summary.map(text => `<p>${text}</p>`).join('')}
        </div>
        <div class="portfolio-container" style="grid-template-columns: 1fr">
        ${filteredPortfolios.map(portfolio => `
            <div class="portfolio-card">
                <div class="card-header">
                    <div class="portfolio-stats">
                        <h3 class="portfolio-name">${portfolio.name}</h3>
                    </div>
                    <div class="labels-container">
                        <span class="label risk-${portfolio.labels[0].text.split(" ")[0].toLowerCase()}">${portfolio.labels[0].text}</span>
                        ${portfolio.labels.slice(1).map( label => `<span class="label">${label.text}</span>`).join(' ')}
                    </div>
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <ul class="portfolio-description" style="">
                            ${portfolio.reasons.map(desc => `<li style="font-size:0.95rem">${desc}</li>`).join('')}
                        </ul>
                        <div class="return-info">
                            <div class="return-value">${portfolio.annual_returns.oneYear}%</div>
                            <div class="return-label">Annual Return</div>
                        </div>
                    </div>
                    <div class="asset-bar">
                        ${portfolio.assets.map((asset, index) =>`<div class="asset-${index + 1}" style="width: ${asset.allocation}%;"></div>`).join('')}
                    </div>
                    <div class="labels-container">
                        ${portfolio.assets.map((asset)=>`<div class="label">${asset.name} (${asset.allocation}%)</div>`).join('')}
                    </div>
                </div>
            </div>
        `).join('')}
        </div>
        <p class="disclaimer">
            These recommendations are for informational purposes only. 
            Please consult with a qualified financial advisor before making investment decisions.
        </p>`;
    }
});