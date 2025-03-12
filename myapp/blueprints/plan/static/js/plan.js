$(document).ready(function() {
    const expenseCategories = {
        labels: ['Housing', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Shopping', 'Other'],
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


    function updateIncomeChart(chart, data) {
        const { totalIncome, totalExpense } = calculateIncomeExpense(data);

        // Update chart data
        chart.data.datasets[0].data = [totalIncome, totalExpense];
        chart.options.scales.y.max = Math.max(totalIncome, totalExpense) * 1.2; // Adjust max scale dynamically
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

    // Update the chart with actual transaction data
    updateIncomeChart(incomeChart, transactions);

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

        // Show only the latest 10 transactions
        transactions.slice(0, 10).forEach(function(transaction) {
            const amount = transaction.credit_amount ? transaction.credit_amount : transaction.debit_amount;
            const amountClass = transaction.credit_amount ? 'positive' : 'negative';
            const amountSign = transaction.credit_amount ? '+' : '-';
            const formattedAmount = amountSign + '$' + Math.abs(amount).toFixed(2);
            const formattedDate = formatDate(transaction.transaction_date);
            
            // Determine badge class based on category
            let badgeClass = 'badge-other';
            // switch(transaction.category.toLowerCase()) {
            //     case 'housing': badgeClass = 'badge-housing'; break;
            //     case 'food': badgeClass = 'badge-food'; break;
            //     case 'transportation': badgeClass = 'badge-transportation'; break;
            //     case 'entertainment': badgeClass = 'badge-entertainment'; break;
            //     case 'utilities': badgeClass = 'badge-utilities'; break;
            //     case 'income': badgeClass = 'badge-income'; break;
            //     case 'shopping': badgeClass = 'badge-shopping'; break;
            // }
            
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
    $(".dropdown-menu").on("click", ".dropdown-item", function (e) {
        e.preventDefault();
        let filterType = $(this).text().trim();
        
        let filteredTransactions = transactions;
        if (filterType === "Income Only") {
            filteredTransactions = transactions.filter(t => t.credit_amount !== null);
        } else if (filterType === "Expenses Only") {
            filteredTransactions = transactions.filter(t => t.debit_amount !== null);
        }

        populateTransactionsTable(filteredTransactions);

        // Update the filter dropdown button text
        $("#filterDropdown").text(`${filterType}`);
    });

    // AI-related button handlers
    $('#viewReportBtn').on('click', function() {
        // Show the AI report modal
        const aiReportModal = new bootstrap.Modal(document.getElementById('aiReportModal'));
        aiReportModal.show();
    });

    // Initialize the transactions table
    populateTransactionsTable(transactions);

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
            success: function(response) {
                console.log(response.message);
                alert(`${response.message}`);
                transactions = response.transactions;
                updateIncomeChart(incomeChart, transactions);
                populateTransactionsTable(transactions);
                $("#csvUploadModal").modal('hide');
            },
            error: function(xhr, status, error) {
                console.error("❌ AJAX Error:", status, error);
                console.error("Response Text:", xhr.responseText);

                try {
                    let responseJSON = JSON.parse(xhr.responseText); // ✅ Try parsing response manually
                    alert(`Error: ${responseJSON.message}`);
                } catch (e) {
                    alert("Unknown error occurred.");
                }
                    }
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
    
});