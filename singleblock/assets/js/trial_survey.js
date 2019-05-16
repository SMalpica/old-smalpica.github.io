var trialSurvey = {
	loadTrialSurvey: function() {
	    
		console.log("loading trial survey");
		$('#trial-survey').load("assets/html/trial_survey.html");
		$('#trial-survey').hide();
		$('#feedback-field').hide();
	    
	},
	hideTrialSurvey: function() {
		$('#trial-survey').hide();
	},
	showTrialSurvey: function() {
		
		// make sure to hide experiment: use the appropriate div references (or add div wrappers) to hide the previous task elements
		//$('#custom-experiment').hide();
		$(".subtask").hide();
		// -----------------------
		
		$('#trial-survey').show();

        // Rules for collecting demographic survey data
        $('#trial-survey-form')
          .form({
            fields: {
                blockAnswer: {
                    identifier: 'blockAnswer',
                    rules: [{
                        type: 'checked',
                        prompt: 'Please choose one of the blocks'
                    }]
                }, 
                confidence: {
                    identifier: 'confidence',
                    rules: [{
                        type: 'checked',
                        prompt: 'Please select an answer'
                    }]
                }
            }
        });

        //$("input:checkbox[name=ethnicity]").change(function() {
        //    var unspecified = $("#ethnicUnspecified").is(":checked");
        //    if (unspecified) {
        //        $("input:checkbox[name=ethnicity]").not("#ethnicUnspecified")
        //            .prop("checked", false);
        //        $(".ethnicityOption").addClass("disabled");
        //    } else {
        //        $(".ethnicityOption").removeClass("disabled");
        //    }
        //});
	},
	collectData: function() {
		//document.getElementById("firstblock").checked = false;
		//document.getElementById("secondblock").checked = false;
		//document.getElementById("confidence1").checked = false;
		//document.getElementById("confidence2").checked = false;
		//document.getElementById("confidence3").checked = false;
		//document.getElementById("confidence4").checked = false;
		//document.getElementById("confidence5").checked = false;
		//document.getElementById("confidence6").checked = false;
		//document.getElementById("confidence7").checked = false;
		
	    var blockAnswer = $("input[type=radio][name=blockAnswer]:checked").val();
	    var confidence = $("input[type=radio][name=confidence]:checked").val();
	    var estimation1 = htmlEscape($("textarea[name=estimationBlock1]").val());
		var estimation2 = htmlEscape($("textarea[name=estimationBlock2]").val());
		
		//$("#select_all").prop('checked', false)
		
		$("#firstBlock").prop('checked', false);
		$("#secondBlock").prop('checked', false);
		$("#confidence1").prop('checked', false);
		$("#confidence2").prop('checked', false);
		$("#confidence3").prop('checked', false);
		$("#confidence4").prop('checked', false);
		$("#confidence5").prop('checked', false);
		$("#confidence6").prop('checked', false);
		$("#confidence7").prop('checked', false);
	    //$("input[type=radio][name=confidence]:checked").removeAttr("checked");
	    $("textarea[name=estimationBlock1]").val("");
		$("textarea[name=estimationBlock2]").val("");

		console.log("patata2")

	    var data = {
	        blockAnswer: blockAnswer,
			confidence: confidence,
			estimation1: estimation1,
			estimation2: estimation2
	    }; 

        return {
            survey_data: data
        }; 
	},
	validateTask: function() {
		console.log("validating trial survey");
		$('#trial-survey-form').form('validate form');
		// falsey value indicates no error...
		if (!$('#trial-survey-form').form('is valid')) {
			return {errorMessage: ""}
		}
		return false;
	}
}

function htmlEscape(str) {
  /* Html-escape a sensitive string. */
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}