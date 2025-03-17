$(document).ready(function() {
    const expenseCategories = {
        labels: ['Housing', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Shopping', 'Others'],
        datasets: [{
            data: [1200, 600, 400, 300, 250, 200, 250],
            backgroundColor: [
                'rgba(96, 165, 250, 0.8)',
                'rgba(52, 211, 153, 0.8)',
                'rgba(167, 139, 250, 0.8)',
                'rgba(251, 191, 36, 0.8)',
                'rgba(244, 114, 182, 0.8)',
                'rgba(236, 72, 153, 0.8)',
                'rgba(148, 163, 184, 0.8)'
            ],
            borderWidth: 1
        }]
    };

    function getUniqueMonths(transactions) {
        let monthSet = new Set();
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.transaction_date);
            const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            monthSet.add(monthYear);
        });

        return Array.from(monthSet).sort((a, b) => new Date(a) - new Date(b)).reverse();
    }

    function populateMonthDropdown() {
        const months = getUniqueMonths(transactions);
        const dropdownMenu = $("#monthDropdown .dropdown-menu");
        dropdownMenu.empty(); // Clear existing items

        months.forEach(month => {
            dropdownMenu.append(`<li><a class="dropdown-item">${month}</a></li>`);
        });

        // Set default selection to the most recent month
        if (months.length > 0) {
            $("#monthDropdownBtn").text(months[0]);
        }
    }

    // Populate the dropdown dynamically
    populateMonthDropdown();

    function calculateIncomeExpense(data) {
        let totalIncome = 0;
        let totalExpense = 0;

        data.forEach(transaction => {
            if (transaction.credit_amount) {
                totalIncome += transaction.credit_amount;
            }
            if (transaction.debit_amount) {
                totalExpense += transaction.debit_amount;
            }
        });

        return { totalIncome, totalExpense };
    }

    // Initialize Income vs Expenses Bar Chart
    const ctx = document.getElementById('incomeChart').getContext('2d');
    const incomeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                label: 'Amount ($)',
                data: [0, 0], // Placeholder data, will be updated dynamically
                backgroundColor: ['rgba(74, 222, 128, 0.8)', 'rgba(248, 113, 113, 0.8)'],
                borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 6000, // Default, will be updated dynamically
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#2b2d42',
                    bodyColor: '#2b2d42',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 10,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            return '$' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            barThickness: 40,
            borderRadius: 6,
            categoryPercentage: 0.8,
            barPercentage: 0.7
        }
    });

    function updateIncomeChart(chart, data) {
        const { totalIncome, totalExpense } = calculateIncomeExpense(data);

        // Update chart data
        chart.data.datasets[0].data = [totalIncome, totalExpense];
        chart.options.scales.y.max = Math.round(Math.max(totalIncome, totalExpense) * 1.2); // Adjust max scale dynamically
        chart.update();

        const balance = totalIncome - totalExpense;

        // Format numbers without decimals
        let formatNumber = (num) => num.toLocaleString(undefined, { maximumFractionDigits: 0 });

        // Update value of Income, Expenses and Balance
        $(".text-center:contains('Income') h3").text(`$${formatNumber(totalIncome)}`);
        $(".text-center:contains('Expenses') h3").text(`$${formatNumber(totalExpense)}`);
        $(".text-center:contains('Balance') h3").text(
            balance >= 0 ? `+$${formatNumber(balance)}` : `-$${formatNumber(Math.abs(balance))}`
        );

        // Update color for Balance
        const balanceElement = $(".text-center:contains('Balance') h3");
        balanceElement.removeClass("positive negative").addClass(balance >= 0 ? "positive" : "negative");
    }

    // Initialize Expense Categories Pie Chart
    const expenseChart = new Chart(
        document.getElementById('expenseChart'),
        {
            type: 'doughnut',
            data: expenseCategories,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                radius: '90%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#2b2d42',
                        bodyColor: '#2b2d42',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 10,
                        padding: 12,
                        boxPadding: 6,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value * 100) / total) + '%';
                                return label + ': $' + value.toLocaleString() + ' (' + percentage + ')';
                            }
                        }
                    }
                }
            }
        }
    );

    function updateExpenseChart(chart, transactions) {
        let categorySums = {
            'Housing': 0, 'Food': 0, 'Transportation': 0, 'Entertainment': 0, 'Utilities': 0, 'Shopping': 0, 'Others': 0
        };
        // Aggregate transaction amounts by category
        transactions.forEach(transaction => {
            if(transaction.category){
                // Convert first letter to uppercase
                category = transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1);
                if (category in categorySums) {
                    categorySums[category] += transaction.debit_amount || 0;
                } else {
                    categorySums['Others'] += transaction.debit_amount || 0;
                }
            }
        });
        // Update chart data
        chart.data.datasets[0].data = Object.values(categorySums);
        chart.update();
    }

    function filterTransactionsByMonth(monthYear) {
        // Extract month and year from the selected dropdown text
        const [monthName, year] = monthYear.split(" ");
        const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth() + 1; // Get month index (1-based)

        // Filter transactions matching the selected month and year
        const filteredTransactions = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.transaction_date);
            return transactionDate.getMonth() + 1 === monthIndex && transactionDate.getFullYear() === parseInt(year);
        });

        return filteredTransactions;
    }

    function updateDashboard(monthYear) {
        let filteredTransactions = filterTransactionsByMonth(monthYear);

        // Update charts and table with filtered data
        updateIncomeChart(incomeChart, filteredTransactions);
        updateExpenseChart(expenseChart, filteredTransactions);
        populateTransactionsTable(filteredTransactions);
    }

    // Handle Month Dropdown Selection
    $("#monthDropdown .dropdown-menu").on("click", ".dropdown-item", function (e) {
        e.preventDefault();
        let selectedMonth = $(this).text().trim();

        // Update month dropdown button text
        $("#monthDropdownBtn").text(selectedMonth);

        // Reset table dropdown button text to 'All Transactions'
        $("#tableDropdownBtn").text('All Transactions');

        // Update the dashboard with filtered data
        updateDashboard(selectedMonth);
    });

    // Initial Data Load (Default to first month in dropdown)
    let defaultMonth = $("#monthDropdownBtn").text().trim();
    updateDashboard(defaultMonth);

    // Format date to more readable format
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Populate Transactions Table
    function populateTransactionsTable(transactions) {
        $('#transactionsTable').empty(); // Clear previous entries

        // Sort transactions by date in descending order
        transactions.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));

        transactions.forEach(function(transaction) {
            const amount = transaction.credit_amount ? transaction.credit_amount : transaction.debit_amount;
            const amountClass = transaction.credit_amount ? 'positive' : 'negative';
            const amountSign = transaction.credit_amount ? '+' : '-';
            const formattedAmount = amountSign + '$' + Math.abs(amount).toFixed(2);
            const formattedDate = formatDate(transaction.transaction_date);
            
            // Determine badge class based on category
            let badgeClass = 'badge-other';
            if(transaction.category){
                switch(transaction.category.toLowerCase()) {
                    case 'housing': badgeClass = 'badge-housing'; break;
                    case 'food': badgeClass = 'badge-food'; break;
                    case 'transportation': badgeClass = 'badge-transportation'; break;
                    case 'entertainment': badgeClass = 'badge-entertainment'; break;
                    case 'utilities': badgeClass = 'badge-utilities'; break;
                    case 'income': badgeClass = 'badge-income'; break;
                    case 'shopping': badgeClass = 'badge-shopping'; break;
                }
            }
            $('#transactionsTable').append(`
                <tr>
                    <td class="text-nowrap">${formattedDate}</td>
                    <td>${transaction.description}</td>
                    <td><span class="badge ${badgeClass}">${transaction.category}</span></td>
                    <td class="text-end ${amountClass} fw-medium">${formattedAmount}</td>
                </tr>
            `);
        });
    }

    // Filter Transactions and Update Dropdown Button Text
    $("#tableDropdown .dropdown-menu").on("click", ".dropdown-item", function (e) {
        e.preventDefault();
        let filterType = $(this).text().trim();
        let monthYear = $("#monthDropdownBtn").text().trim();
        let filteredTransactions = filterTransactionsByMonth(monthYear);
        if (filterType === "Income Only") {
            filteredTransactions = filteredTransactions.filter(t => t.credit_amount !== null);
        } else if (filterType === "Expenses Only") {
            filteredTransactions = filteredTransactions.filter(t => t.debit_amount !== null);
        }

        populateTransactionsTable(filteredTransactions);

        // Update the filter dropdown button text
        $("#tableDropdownBtn").text(`${filterType}`);
    });

    // Upload CSV to database
    $("#importBtn").click(function() {
        var fileInput = $("#csvFile")[0].files[0];  // Get the selected file

        if (!fileInput) {
            alert('Please select a CSV file first.');
            return;
        }

        var formData = new FormData();
        formData.append("file", fileInput);  // Append the file to FormData

        $.ajax({
            url: "upload_csv",  // Flask route
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            error: function(xhr, status, error) {
                console.error("AJAX Error:", status, error);
                console.error("Response Text:", xhr.responseText);
                try {
                    let responseJSON = JSON.parse(xhr.responseText); // Try parsing response manually
                    alert(`Error: ${responseJSON.message}`);
                } catch (e) {
                    alert("Unknown error occurred.");
                }
            }
        }).then((response)=>{
            console.log(response.message);
            alert(`${response.message}`);
            // Update table & charts
            transactions = response.transactions;
            populateMonthDropdown();
            defaultMonth = $("#monthDropdown").text().trim();
            updateDashboard(defaultMonth);
            $("#csvUploadModal").modal('hide');

            // 2nd AJAX call to Flask backend for calling Batch API
            console.log("start uploading batch data to OpenAI API...");
            return $.ajax({
                url: "submit_classification_batch",
                type: "POST",
                dataType: "json",
                error:(xhr, status, error)=>{
                    console.error("AJAX Error:", status, error);
                    console.error("Response Text:", xhr.responseText);
                }
            });
        }).always((response)=>{
            console.log(response.message);

            // 3rd AJAX call to Flask backend for updating transaction categories
            console.log("Start updating database with transaction categories...");
            return $.ajax({
                url: "process_classification_batch",
                type: "POST",
                dataType: "json",
                success:(response)=>{
                    // Update table & charts
                    transactions = response.transactions;
                    defaultMonth = $("#monthDropdown").text().trim();
                    updateDashboard(defaultMonth);

                    console.log(response.message);
                    alert(`${response.message}`);
                },
                error:(xhr, status, error)=>{
                    console.error("AJAX Error:", status, error);
                    console.error("Response Text:", xhr.responseText);
                }
            });
        });
    });

    // Remove transactions button
    $('#removeBtn').on('click', function() {
        if (confirm('Are you sure you want to remove all transactions for this period?')) {
            // In a real app, this would delete the transactions
            alert('Transactions removed successfully');
            
            // Clear the transactions table (in this demo)
            $('#transactionsTable').empty();
        }
    });

    // AJAX call to get LLM generated report
    $("#viewReportBtn").on('click', ()=>{
        $("#aiReportModal").modal("show"); 
        let dateString = $("#monthDropdown").text().trim(); // Get the date input value (e.g., "March 2025")
        if (dateString === "Select Month") {
            alert("Please select a month before generating the report.");
            return;
        }
        let { month, year } = parseMonthYear(dateString);
        $.ajax({
            url: "generate_financial_report",  
            type: "POST",
            contentType:"application/json",
            data: JSON.stringify({ month: month, year: year }),
            dataType: "json",
            success: function (data) {
                // Create report with LLM response
                const formattedDate = new Intl.DateTimeFormat('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                }).format(new Date());
                $("#aiReportModalDate").text("Generated on " + formattedDate);
                $("#aiReportModal .modal-body").html(generateReportHTML(data));

                $("#loadingOverlay").css("visibility", "hidden"); // Hide loading screen
                $('#aiReportModal').on('hidden.bs.modal', ()=>{
                    $("#loadingOverlay").css("visibility", "visible"); // Show loading screen when modal is opened again
                });
            },
            error: (xhr, status, error)=> {
                console.error("AJAX Error:", status, error);
                console.error("Response Text:", xhr.responseText);
                alert(`${xhr.responseText}`);
                $("#aiReportModal").modal('hide');
            }

        });
    });

    function parseMonthYear(dateString) {
        const months = {
            "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
            "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12
        };

        let parts = dateString.split(" "); // Split into ["Month", "Year"]
        let month = months[parts[0]] || null;
        let year = parseInt(parts[1]) || null;

        return { month, year };
    }

    function generateReportHTML(data) {
        return `
            <h5 class="border-bottom pb-2 mb-3">Summary</h5>
            <p>${data.summary || "No summary available."}</p>

            <h5 class="border-bottom pb-2 mb-3 mt-4">Spending Patterns</h5>
            <p>Your top spending categories are:</p>
            <ol>
                ${data.spending.map(category => `
                    <li><strong>${category.name.charAt(0).toUpperCase() + category.name.slice(1)} (${category.percentage}%)</strong>: ${category.description}</li>
                `).join("")}
            </ol>

            <h5 class="border-bottom pb-2 mb-3 mt-4">Recommendations</h5>
            ${data.recommendations.map(rec => `
                <div class="card mb-3">
                    <div class="card-body">
                        <h6 class="card-title"><i class="bi ${rec.icon} text-primary me-2"></i>${rec.title}</h6>
                        <p class="card-text">${rec.description}</p>
                    </div>
                </div>
            `).join("")}
        `;
    }

    
});