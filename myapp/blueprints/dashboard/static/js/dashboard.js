$(document).ready(function() {

    // Set today's date as the minimum selectable date
    let today = new Date().toLocaleDateString('en-CA');
    $("#goalTargetDate").attr("min", today);

    // Handle add financial goal button
    $("#addGoalForm").submit(function(event) {
        event.preventDefault();

        // Get input values
        const name = $("#goalName").val();
        const targetAmount = parseFloat($("#goalTarget").val());
        const currentDate = new Date().toLocaleDateString('en-CA');
        const targetDate = $("#goalTargetDate").val();

        // Create new goal card
        const newGoal =
        `
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <div class="card-title mb-3">${name}</div>
                        <!-- Start & Target Dates -->
                        <div class="d-flex justify-content-between mb-2 text-muted">
                            <span class="start-date">${formatDate(currentDate)}</span>
                            <span class="target-date">${formatDate(targetDate)}</span>
                        </div>
                        <!-- Progress Bar -->
                        <div class="progress mb-2" style="height: 8px;">
                            <div class="progress-bar" role="progressbar" style="width: 0%;"></div>
                        </div>
                        <!-- Amounts -->
                        <div class="d-flex justify-content-between">
                            <span class="stats-label">$0</span>
                            <span class="stats-label text-end">$${targetAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Create FinancialGoal object to save to server 
        let financialGoal = {
            name: name,
            target_amount: targetAmount,
            target_date: targetDate,
        };

        $.ajax({
            type: "POST",
            url: "/auth/add-financial-goal",
            contentType: "application/json",
            data: JSON.stringify(financialGoal),
            success: function (response) {
                alert("Financial goal added successfully!");

                // Append to financial goals section
                $("#financialGoals").append(newGoal);

                // Close modal
                $("#addGoalModal").modal("hide");

                // Clear form fields
                $("#addGoalForm")[0].reset();

                location.reload(); // Reload to update the UI
            },
            error: function (xhr) {
                alert("Error adding financial goal: " + xhr.responseText);
            }
        });
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

    // Add financial goals from db
    const financialGoalsContainer = $("#financialGoals");
    financialGoalsContainer.empty();

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');  // Ensures 2-digit day
        const month = date.toLocaleString('en-US', { month: 'short' }); // Short month name
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    }

    financial_goals.forEach(goal=>{
        let goalCard = `
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <div class="card-title mb-3">${goal.name}</div>
                        <!-- Start & Target Dates -->
                        <div class="d-flex justify-content-between mb-2 text-muted">
                            <span class="start-date">${formatDate(goal.added_on)}</span>
                            <span class="target-date">${formatDate(goal.target_date)}</span>
                        </div>
                        <!-- Progress Bar -->
                        <div class="progress mb-2" style="height: 8px;">
                            <div class="progress-bar" role="progressbar" style="width: ${goal.current_amount / goal.target_amount * 100}%;"></div>
                        </div>
                        <!-- Amounts -->
                        <div class="d-flex justify-content-between">
                            <span class="stats-label">$${goal.current_amount.toLocaleString()}</span>
                            <span class="stats-label text-end">$${goal.target_amount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        financialGoalsContainer.append(goalCard);
    }); 

    // Initial data fetch
    fetchPortfolioData();
        
    // Update data every 30 seconds
    setInterval(fetchPortfolioData, 30000);
});