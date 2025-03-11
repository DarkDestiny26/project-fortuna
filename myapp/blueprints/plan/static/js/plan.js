$(document).ready(function() {
    // Sample data
    const incomeData = {
        labels: ['Income', 'Expenses'],
        datasets: [{
            label: 'Amount ($)',
            data: [5000, 3200],
            backgroundColor: ['rgba(74, 222, 128, 0.8)', 'rgba(248, 113, 113, 0.8)'],
            borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
            borderWidth: 1
        }]
    };

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

    const transactions = [
        { id: 1, date: '2025-03-01', description: 'Rent Payment', category: 'Housing', amount: -1200 },
        { id: 2, date: '2025-03-02', description: 'Grocery Store', category: 'Food', amount: -87.45 },
        { id: 3, date: '2025-03-03', description: 'Gas Station', category: 'Transportation', amount: -45.50 },
        { id: 4, date: '2025-03-05', description: 'Salary Deposit', category: 'Income', amount: 2500 },
        { id: 5, date: '2025-03-08', description: 'Restaurant', category: 'Food', amount: -62.35 },
        { id: 6, date: '2025-03-10', description: 'Movie Tickets', category: 'Entertainment', amount: -32.00 },
        { id: 7, date: '2025-03-15', description: 'Electric Bill', category: 'Utilities', amount: -78.90 },
        { id: 8, date: '2025-03-20', description: 'Salary Deposit', category: 'Income', amount: 2500 },
        { id: 9, date: '2025-03-22', description: 'Clothing Store', category: 'Other', amount: -124.50 },
        { id: 10, date: '2025-03-25', description: 'Phone Bill', category: 'Utilities', amount: -85.00 }
    ];

    // Initialize Income vs Expenses Bar Chart
    const incomeChart = new Chart(
        document.getElementById('incomeChart'),
        {
            type: 'bar',
            data: incomeData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 6000,
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
        }
    );

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
    function populateTransactions() {
        transactions.forEach(function(transaction) {
            const amountClass = transaction.amount >= 0 ? 'positive' : 'negative';
            const amountSign = transaction.amount >= 0 ? '+' : '-';
            const formattedAmount = amountSign + '$' + Math.abs(transaction.amount).toFixed(2);
            const formattedDate = formatDate(transaction.date);
            
            // Determine badge class based on category
            let badgeClass = 'badge-other';
            switch(transaction.category.toLowerCase()) {
                case 'housing': badgeClass = 'badge-housing'; break;
                case 'food': badgeClass = 'badge-food'; break;
                case 'transportation': badgeClass = 'badge-transportation'; break;
                case 'entertainment': badgeClass = 'badge-entertainment'; break;
                case 'utilities': badgeClass = 'badge-utilities'; break;
                case 'income': badgeClass = 'badge-income'; break;
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

    // AI-related button handlers
    $('#viewReportBtn').on('click', function() {
        // Show the AI report modal
        const aiReportModal = new bootstrap.Modal(document.getElementById('aiReportModal'));
        aiReportModal.show();
    });

    // Initialize the transactions table
    populateTransactions();

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
                alert(`${response.message}`);
            },
            error: function(xhr, status, error) {
                alert(`${xhr.responseText}`);
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