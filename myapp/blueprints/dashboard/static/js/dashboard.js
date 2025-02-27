$(document).ready(function() {

    $("#addGoalForm").submit(function(event) {
        event.preventDefault();

        // Get input values
        const goalName = $("#goalName").val();
        const goalTarget = parseFloat($("#goalTarget").val());
        const goalCurrent = parseFloat($("#goalCurrent").val());

        // Calculate progress percentage
        const progressPercentage = (goalCurrent / goalTarget) * 100;

        // Create new goal card
        const newGoal = `
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <div class="card-title mb-3">${goalName}</div>
                        <div class="progress mb-2" style="height: 8px;">
                            <div class="progress-bar" role="progressbar" style="width: ${progressPercentage}%"></div>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span class="stats-label">$${goalCurrent.toFixed(2)}</span>
                            <span class="stats-label text-end">$${goalTarget.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Append to financial goals section
        $("#financialGoals").append(newGoal);

        // Close modal
        $("#addGoalModal").modal("hide");

        // Clear form fields
        $("#addGoalForm")[0].reset();
    });

    function fetchPortfolioData() {
        $.ajax({
            url: 'get_user_portfolios', // Update with the correct API endpoint
            method: 'POST',
            contentType: "application/json",
            data: JSON.stringify({user_id: user_portfolios[0].user_id}),
            success: function(response) {
                populateTable(response["user_portfolios"]);
            },
            error: function(error) {
                console.log("Error fetching portfolio data:", error);
            }
        });
    }

    // Populate portfolios table
    function populateTable(user_portfolios) {
        const tbody = $('#portfoliosTable tbody');
        tbody.empty();
        
        user_portfolios.forEach(up => {
            const dailyReturn = (up.portfolio.daily_return * 100).toFixed(2);
            const returnClass = dailyReturn >= 0 ? "text-success" : "text-danger";
            const returnSymbol = dailyReturn >= 0 ? "+" : "";
            const row = `<tr class="asset-row">
                <td>${up.portfolio.name}</td>
                <td>${new Date(up.added_on).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td>$${up.value.toFixed(2)}</td>
                <td><span class="${returnClass}">${returnSymbol}${dailyReturn}%</span></td>
            </tr>`;
            tbody.append(row);
        });
    }

    // Initial data fetch
    fetchPortfolioData();
        
    // Update data every 30 seconds
    setInterval(fetchPortfolioData, 30000);
});