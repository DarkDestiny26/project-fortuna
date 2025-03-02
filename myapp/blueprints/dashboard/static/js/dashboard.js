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

    // AJAX to fetch latest user portfolio data to update dashboard 
    function fetchPortfolioData() {
        $.ajax({
            url: 'get_user_portfolios',
            method: 'POST',
            contentType: "application/json",
            data: JSON.stringify({user_id: user_portfolios[0].user_id}),
            success: function(response) {
                const user_portfolios = response["user_portfolios"]
                populateTable(user_portfolios);
                updateTotalAssets(user_portfolios);
                updatePnl(user_portfolios);
            },
            error: function(error) {
                console.log("Error fetching portfolio data:", error);
            }
        });
    }

    // Update Total Assets card
    function updateTotalAssets(user_portfolios){
        let totalAssets = 0;

        user_portfolios.forEach(up => {
            totalAssets += up.value;
        });

        const formattedValue = "$" + totalAssets.toLocaleString(undefined, {maximumFractionDigits: 0});
        $("#totalAssets").text(formattedValue);

    }

    // Update Today's PnL card
    function updatePnl(user_portfolios){

        let pnl = 0;
        let totalValue = 0;

        user_portfolios.forEach(up => {
            pnl += up.value - (up.value / (1 + up.portfolio.daily_return));
            totalValue += up.value;

            //console.log(`${up.portfolio.name} | value: ${up.value} | daily_return: ${up.portfolio.daily_return}`);
        });

        const totalReturns = totalValue / (totalValue - pnl);

        const pnlElement = $("#pnl");
        const returnsElement = $("#returns");
        const badgeElement = $(".badge");
        const graphIcon = $(".icon i");
        
        const pnlFormatted = (pnl >= 0 ? "+" : "-") + "$" + Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 0 });
        const returnsFormatted = Math.abs(totalReturns).toFixed(2) + "%";
        
        pnlElement.text(pnlFormatted);
        returnsElement.text(returnsFormatted);
        
        if (pnl >= 0) {
            pnlElement.removeClass("text-danger").addClass("text-success");
            badgeElement.removeClass("badge-danger").addClass("badge-success");
            returnsElement.removeClass("bi-arrow-down").addClass("bi-arrow-up");
            graphIcon.removeClass("bi-graph-down").addClass("bi-graph-up");
        } else {
            pnlElement.removeClass("text-success").addClass("text-danger");
            badgeElement.removeClass("badge-success").addClass("badge-danger");
            returnsElement.removeClass("bi-arrow-up").addClass("bi-arrow-down");
            graphIcon.removeClass("bi-graph-up").addClass("bi-graph-down");
        }
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