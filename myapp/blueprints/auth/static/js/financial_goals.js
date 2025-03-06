$(document).ready(function() {
    let goalCount = 1;

    // Set the minimum date for the goal date field
    function setMinDate(input) {
      const today = new Date().toISOString().split("T")[0];
      $(input).attr("min", today);
    }

    // Apply the min date to the first goal field
    setMinDate("#goal-date-1");
    
    // Add new goal
    $('#add-goal-btn').click(function() {
      goalCount++;
      
      // Clone the first goal card
      const newGoal = $('.goal-card:first').clone();
      
      // Update IDs and labels
      newGoal.attr('id', `goal-${goalCount}`);
      newGoal.find('h2').text(`Goal #${goalCount}`);
      
      // Update form element IDs and clear values
      newGoal.find('input').each(function() {
        const idParts = $(this).attr('id').split('-');
        idParts[idParts.length - 1] = goalCount;
        const newId = idParts.join('-');
        $(this).attr('id', newId).val('');
      });

      // Update label 'for' attributes to match new input IDs
      newGoal.find('label').each(function() {
        const forAttr = $(this).attr('for');
        if (forAttr) {
          const forParts = forAttr.split('-');
          forParts[forParts.length - 1] = goalCount;
          const newFor = forParts.join('-');
          $(this).attr('for', newFor);
        }
      });

      // Apply min date restriction to new goal-date input
      setMinDate(newGoal.find("input[type='date']"));
      
      // Show remove button for all goals
      $('.remove-goal').removeClass('d-none');
      
      // Add event listener to remove button
      newGoal.find('.remove-goal').removeClass('d-none').click(function() {
        $(this).closest('.goal-card').remove();
        
        // If only one goal remains, hide its remove button
        if ($('.goal-card').length === 1) {
          $('.remove-goal').addClass('d-none');
        }
        
        // Update goal numbers
        updateGoalNumbers();
      });
      
      // Add the new goal to the container
      $('#goals-container').append(newGoal);
    });
    
    // Function to update goal numbers after removal
    function updateGoalNumbers() {
      $('.goal-card').each(function(index) {
        const goalNumber = index + 1;
        $(this).find('h2').text(`Goal #${goalNumber}`);
        
        // Update input IDs and label 'for' attributes to match new goal numbers
        $(this).find('input').each(function() {
          const idParts = $(this).attr('id').split('-');
          const fieldName = idParts[idParts.length - 2]; // Get the field name (name, amount, date)
          const newId = `goal-${fieldName}-${goalNumber}`;
          $(this).attr('id', newId);
        });
        
        $(this).find('label').each(function() {
          const forAttr = $(this).attr('for');
          if (forAttr) {
            const forParts = forAttr.split('-');
            const fieldName = forParts[forParts.length - 2]; // Get the field name
            const newFor = `goal-${fieldName}-${goalNumber}`;
            $(this).attr('for', newFor);
          }
        });
      });
    }
    
    // Add event listener to the first goal's remove button
    $('.remove-goal:first').click(function() {
      if ($('.goal-card').length > 1) {
        $('#goal-1').remove();
        updateGoalNumbers();
      }
    });

});