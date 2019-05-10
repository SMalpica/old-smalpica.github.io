
/* UI Parameters *******************************************************************/

var PARAMS = {
  ENABLE_MSEC_SET_URL: false, // enables setting image display time in the url like so: '?msecImg=1000'
  NUM_MSEC_CROSS: 750, // how long the fixation cross is shown for
  //NUM_MSEC_IMAGE: 2000, // num milliseconds to show each image for
  NUM_MSEC_IMAGE: 200, // num milliseconds to show each image for
  NUM_MSEC_SENTINEL: 750, // how long a sentinel image is shown for
  NUM_MSEC_CHAR: 400, // how long the code chart is shown

  IMG_WIDTH: 1000 , // max img width
  IMG_HEIGHT: 700 , // max img height

  N_BUCKETS: 1,
  N_SUBJ_FILES: 3,
  
  NUM_IMGS_BLOCK: 15,
  NUM_BLOCKS_TRIAL: 2,

  MAX_INVALID_ALLOWED_TUTORIAL: 3,
  MAX_INCORRECT_SENTINELS_ALLOWED_TUTORIAL: 3,

  GIVE_FEEDBACK: false, // should feedback be given during the tutorial
  NUM_MSEC_FEEDBACK: 2000, // how long does the feedback stay on the screen
}

// messages shown if feedback is given
var POSITIVE_MESSAGE = "Keep up the good work!";
var NEGATIVE_MESSAGE = "Please type the triplet you see when the image vanishes.";

// path to the task data to use
var DATA_BASE_PATH = "assets/task_data/";
// base path relative to which image paths are defined
var IMAGE_BASE_PATH = "assets/"
var SUBJECT_FILES_BASE_PATH = DATA_BASE_PATH + "full_subject_files/";
var FIXATION_CROSS = DATA_BASE_PATH + "fixation-cross.jpg"

/* Global vars **********************************************************************/

// variables we want to save to store to outputs
var SUBJ_ID;
var BUCKET_NUM;
var SUBJ_FILE_PATH;
var OPEN_TIME; // when the url is first loaded
var START_TIME; // when they first click the "continue" button
var LOAD_TIME; // when the last image loads and the task is ready to go

// normal images
var IMAGES = new Array(); // preload the images
// character code images
var CHAR_IMAGES = new Array();

var CHECKED_TUTORIAL_FLAG = false;
var IS_TUTORIAL = true;
var MESSAGE = "";
var MESSAGE_IS_POSITIVE = true;

// during the task, keeps track of how the participant is doing
// this count is only valid up until you hit the submit button
var SCORES = {
  SENTINEL_CORRECT: 0,
  SENTINEL_TOTAL: 0,
  IMAGE_CORRECT: 0,
  IMAGE_TOTAL: 0,
  INVALID: 0
}

/* End vars ************************************************************/

var custom = {
  loadTasks: function() {

    /*
     * Loads data needed to run the task and does some one-time setup, such as:
     *  - timestamping the start of the task
     *  - selecting a subject file to use and loading it
     *  - preloading images
     *
     * returns [obj, int]: A length-two list where the first element is the loaded task data
     *  and the second element is the number of trails (number of images) in the task.
     */

    OPEN_TIME = new Date();
    DEBUG = gup("debug") == "true";

    $(".instruction-button").click(function() {
      START_TIME = new Date();
      $(this).unbind();
    })

     //hide all subtasks to begin with
    $(".subtask").hide();

    // set the size of the images
    $("img.img-main").css({
      "width": "100%",
      "height": "100%",
      "objectFit": "contain"
    });

    BUCKET_NUM = gupOrRandom("bucket", PARAMS.N_BUCKETS);
    //SUBJ_ID = gupOrRandom("subj", PARAMS.N_SUBJ_FILES);
	SUBJ_ID=24;	//TODO: volver a cambiar
    console.log("Bucket", BUCKET_NUM, "subjId", SUBJ_ID);
      SUBJ_FILE_PATH = SUBJECT_FILES_BASE_PATH + "bucket" + BUCKET_NUM + "/subject_file_" + SUBJ_ID + ".json";

    return $.get(SUBJ_FILE_PATH).then(function(tasks) {
      if (DEBUG) {
        if (tasks.length > 1) {
          tasks = tasks.slice(0, 1);
        }
      }
      // pre-load all the images
	  console.log(tasks);
	  //console.log(tasks[0].firstblock.images);
	  
      preloadImages(tasks);

      // set the correct image exposure
      if (PARAMS.ENABLE_MSEC_SET_URL) {
        var urlMsecImg = gup('msecImg');
        if (urlMsecImg.length > 0) {
          PARAMS.NUM_MSEC_IMAGE = parseInt(urlMsecImg);
        }
      }
      console.log("Image exposure time:", PARAMS.NUM_MSEC_IMAGE);
      console.log("CC exposure time:", PARAMS.NUM_MSEC_CHAR);
      console.log("S exposure time:", PARAMS.NUM_MSEC_SENTINEL);


      return [tasks, tasks.length, PARAMS.NUM_IMGS_BLOCK, PARAMS.NUM_BLOCKS_TRIAL];
    });
  },

  showTask: function(taskInput, taskIndex, imageIndex, blockIndex, taskOutput) {
    /*
     * Shows the next trial of the experiment (fix cross, image, code chart, and character input.)
     *
     * taskInput - the task data returned from loadTasks
     * taskIndex - the number of the current subtask (image)
     * taskOutput - a partially filled out object containing the results (so far) of the task.
     *
     * returns: None
     */
    var nMsecFeedback = (PARAMS.GIVE_FEEDBACK && MESSAGE && IS_TUTORIAL) ? PARAMS.NUM_MSEC_FEEDBACK : 0;
    var messageClass = MESSAGE_IS_POSITIVE ? "positive" : "negative";

    // terminate task early if they do not have required performance on tutorial
    IS_TUTORIAL = isTutorial(taskInput[taskIndex]);
    if (IS_TUTORIAL || didEndTutorial(taskInput, taskIndex, taskOutput)) {
      if (!passedTutorial()) {
        return;
      }
    }

	console.log("image index: ",imageIndex,", block index: ",blockIndex,", taskIndex: ",taskIndex);

    $(".subtask").hide();
    $('#next-button').hide(); // Hide the next button; we will handle control flow for this task

    hideIfNotAccepted();

    if (nMsecFeedback > 0) {
      var feedbackMessageElt = $("#feedback-message");
      feedbackMessageElt.empty();
      feedbackMessageElt.append('<div class="ui message ' + messageClass + '"><div class="header">' + MESSAGE + '</div></div>');
      $("#feedback-subtask").show();
    }
    
	//waits nMsec and then calls the function
	//setTimeout(subtaskFunc.bind(this, taskInput, taskIndex, taskOutput), nMsecFeedback)
	setTimeout(showImage.bind(this, taskInput, taskIndex, imageIndex, blockIndex, taskOutput), nMsecFeedback)
  },

  collectData: function(taskInput, taskIndex, taskOutput) {
    /*
     * Records the experimental output for the current subtask (image).
     *
     * taskInput - the task data returned from loadTasks
     * taskIndex - the number of the current subtask (image)
     * taskOutput - a partially filled out object containing the results (so far) of the task.
     *
     * returns: the new taskOutput object containing the data for the current subtask.
     */
	 //IN TRIAL_SURVEY.JS
    //var rememberedCode = $("#remembered-char").val().toUpperCase();
    //var isValidCode = _includes(taskInput[taskIndex].codes, rememberedCode);
    //var isValidCode = _isCodePresent(rememberedCode, taskInput[taskIndex].codes);
    //var coord = isValidCode ? taskInput[taskIndex].coordinates[rememberedCode] : false;
    //staskOutput[taskIndex] =  {
    //  rememberedCode: rememberedCode,
    //  isValidCode: isValidCode,
    //  coordinate: coord
    //};
	//TODO: collect the new answers
     return taskOutput;
  },

  validateTask: function(taskInput, taskIndex, taskOutput) {
    /*
     * Reports whether the data corresponding to the current
     * subtask (image) is valid (e.g. fully filled out)
     *
     * taskInput - the task data returned from loadTasks
     * taskIndex - the number of the current subtask (image)
     * taskOutput - a partially filled out object containing the results (so far) of the task.
     *
     * returns: falsey value if validation passed for the taskIndex-th subjtask.
     *  Truthy value if validation failed. To display a specific error message,
     *  return an object of the form {errorMessage: ""}
     */
    var res = $('#letters-form').form('is valid');

    if (!res) {
      return {errorMessage: "Please enter a valid code (an upper-case letter followed by 2 numbers)."};
    }

    // keep track of scores
    //var validCode = taskOutput[taskIndex].isValidCode;
    //SCORES.INVALID += !validCode;
    //var correctTrial;
    //if (isSentinel(taskInput[taskIndex])) {
    //  SCORES.SENTINEL_TOTAL += 1;
    //  var codeEntered = taskOutput[taskIndex].rememberedCode;
    //  var correctCodes = taskInput[taskIndex].correct_codes;
    //  var gotSentinel = _includes(correctCodes, codeEntered);
    //  SCORES.SENTINEL_CORRECT += gotSentinel;
    //  correctTrial = gotSentinel;
    //} else {
    //  SCORES.IMAGE_TOTAL += 1;
    //  SCORES.IMAGE_CORRECT += validCode;
    //  correctTrial = validCode;
    //}
    //MESSAGE = correctTrial ? POSITIVE_MESSAGE : NEGATIVE_MESSAGE;
    //MESSAGE_IS_POSITIVE = correctTrial;
	//TODO:validate task (with accuracy maybe)
    return false; // we'll allow the task to continue either way but we'll remember if an invalid code was entered
  },

  getPayload: function(taskInputs, taskOutputs, outlierOutputs) {
    /*
     * Returns the final output object to be saved from the task.
     *
     * taskInput - the task data returned from loadTasks
     * taskOutput - a fully filled out object containing the results of the task.
     *
     * returns: all the data you want to be stored from the task.
     */

    // delete codes and coordinates from taskInputs to save space
    //taskInputs.forEach(function(elt, i) {
    //  delete elt.codes;
    //  delete elt.coordinates;
    //})

    // task inputs to store, including parameters used
    var inputs = {
      params: PARAMS,
      tasks: taskInputs,
      subjId: SUBJ_ID,
      bucketNum: BUCKET_NUM,
      subjFilePath: SUBJ_FILE_PATH
    }

    var endTime = new Date();

    // compile timing data
    var timing = {
      openTime: OPEN_TIME,
      loadTime: LOAD_TIME,
      startTime: START_TIME,
      endTime: endTime,
      timeToCompleteFromOpenMsec: endTime - OPEN_TIME,
      timeToLoadMsec: LOAD_TIME - OPEN_TIME,
      timeToCompleteFromStartMsec: endTime - START_TIME
    }

    // put the survey data under a separate key
    var surveyData = taskOutputs.survey_data;
    delete taskOutputs.survey_data;	

    // task outputs to store, including timing data
    var outputs = {
      timing: timing,
      surveyData: surveyData,
      tasks: taskOutputs,
	  outliers: outlierOutputs
    }

    return {
      'inputs': inputs,
      'outputs': outputs
    }

  }

};

function passedTutorial() {
  /* Returns false if the subject has failed the tutorial, else true.*/
  var failedValidCheck = SCORES.INVALID > PARAMS.MAX_INVALID_ALLOWED_TUTORIAL;
  var failedSentinelCheck = (SCORES.SENTINEL_TOTAL - SCORES.SENTINEL_CORRECT) > PARAMS.MAX_INCORRECT_SENTINELS_ALLOWED_TUTORIAL;
    // check accuracy
  if (failedValidCheck || failedSentinelCheck) {
    $('.subtask').hide();
    $('#next-button').hide();
    $("#accuracy-error-message").show();
    return false;
  }
  return true;
}

//TODO: maybe the problem is with the async??
//async function subtaskFunc(taskInput,taskIndex,taskOutput){
//function subtaskFunc(taskInput,taskIndex,taskOutput){
	//setTimeout(showFixationCross.bind(this, taskInput, taskIndex, taskOutput), nMsecFeedback);	//first waits, then calls the function
	//console.log("show task before show image")
	//$('#next-button').hide();
	//showImage(taskInput,taskIndex,taskOutput);
	//for (i = 0; i < PARAMS.NUM_IMGS_BLOCK-1; i++) { 
		//showImage(taskInput, taskIndex, taskOutput);
		//await sleep(PARAMS.NUM_MSEC_IMAGE);
	//}
	
	  // focus and next on enter
	//sleep(PARAMS.NUM_MSEC_IMAGE);
  
	//console.log("time after sleep: "+new Date().getTime())
	//clickButtonOnEnter($('#remembered-char'), $('#next-button'));

	// Hand back control to the user: show the next button (but not the back button)
	//$('#next-button').show();
//}

function showFixationCross(taskInput, taskIndex, taskOutput) {
  /* Displays the fixation cross on the screen and queues the next target image. */
  $('.subtask').hide();
  $("#show-cross-subtask").show();
  setTimeout(showImage.bind(this, taskInput, taskIndex, taskOutput), PARAMS.NUM_MSEC_CROSS);
}

function showImage(taskInput, taskIndex, imageIndex, blockIndex, taskOutput) {
  /* Displays a target image on the screen and queues the corresponding code chart. */
  //console.log("show image",taskIndex,blockIndex,imageIndex)
  $('.subtask').hide();
  $("#next-button").hide();
  var imgFile = IMAGES[taskIndex*PARAMS.NUM_IMGS_BLOCK*2+blockIndex*PARAMS.NUM_IMGS_BLOCK+imageIndex].src;
  //console.log(imgFile)
  $("#img-main").attr("src", imgFile);
  $("#show-image-subtask").show();
  if(imageIndex<PARAMS.NUM_IMGS_BLOCK-1){
	  setTimeout(function(){$("#next-button").click()}, PARAMS.NUM_MSEC_IMAGE);
  }
  else if (imageIndex==PARAMS.NUM_IMGS_BLOCK-1){
	  //if the first block is ending, show intermediate message
	  //if the second block is ending, show question, ask for an estimation and for confidence in both answers
	  		  
	  setTimeout(function(){
		  $("#next-button").show();
		  $('.subtask').hide();
		  if(blockIndex==0){
			  console.log("nextBlock")
			  
			  $("#next-button").text("Next block!");
		  }
		  else{
			  $("#next-button").text("Continue");
			  trialSurvey.showTrialSurvey();
			  console.log("nextTrial")
		  }
	  },PARAMS.NUM_MSEC_IMAGE);	  
  }
  //setTimeout(function(){},PARAMS.NUM_MSEC_IMAGE);
  //var nSecs = isSentinel(taskInput[taskIndex]) ? PARAMS.NUM_MSEC_SENTINEL : PARAMS.NUM_MSEC_IMAGE;
  //var nSecs = PARAMS.NUM_MSEC_IMAGE;
  //setTimeout(function(){ showDigits(taskInput, taskIndex, taskOutput); }, nSecs);
}

function sleep(miliseconds){
	var end = new Date().getTime() + miliseconds;
	while(new Date().getTime()<end){}
}

function showDigits(taskInput, taskIndex, taskOutput) {
  /* Displays a code chart and queues the code entry. */

    // hide all except the relevant sub-task:
    $(".subtask").hide();
    $("#show-digits-subtask").show();

    var digitsFile = CHAR_IMAGES[taskIndex].src;
    $("#img-digits").attr("src", digitsFile)

    // run charEntry after NUM_MSEC_CHAR seconds elapse
    setTimeout(function(){ charEntry(taskInput, taskIndex, taskOutput); }, PARAMS.NUM_MSEC_CHAR); // show character chart for NUM_MSEC_CHAR, then switch to manual entry

};

function charEntry(taskInput, taskIndex, taskOutput) {
  /* Displays and sets up the form to input the character code that was seen. */
  $('#letters-form').form('reset');
  $("#remembered-char").val('');

  // set the height of the char entry container to the height of the last seen image
  $(".img-sized-container").height(Math.max($("#img-digits").height(), 100));

  // hide all except the relevant sub-task:
  $(".subtask").hide();
  $('#remembered-char-subtask').show();

   $('#letters-form').form({
          fields: {
            answer: {
              identifier: 'remembered-char',
              rules: [
              {
                type: 'minCount[1]',
                prompt: 'Please enter a code.'
              },
              {
                type: 'exactLength[3]',
                prompt: 'A valid code is composed of 3 characters.'
              }, // the form input maxlength already guarantees entry will be at most 3 characters long
              {
                type: 'regExp[/^[A-Za-z0-9\ ]*$/]',
                prompt: 'A valid code should only contain letters and numbers.'
              }
              ]
            }
          }
        });

  // focus and next on enter
  clickButtonOnEnter($('#remembered-char'), $('#next-button'));

  // Hand back control to the user: show the next button (but not the back button)
  $('#next-button').show();

};

function preloadImages(data) {
  /*
   * Loads all images for the task so they are ready to go when the user starts.
   *
   * Shows a progress bar and disables the button to start the task until all
   * images are loaded.
   *
   * data: task data loaded from a subject file.
   */
  var continueButton = $(".instruction-button");
  _disable(continueButton);



  var cross = new Image(); // fixation cross image

  // populates arrays to store the Image elements
  data.forEach(function(elt, i) {
    elt.firstblock.images.forEach(function(elt, j){
		IMAGES.push(new Image());
		//console.log(elt)
	});
	elt.secondblock.images.forEach(function(elt, j){
		IMAGES.push(new Image());
	});
    //CHAR_IMAGES.push(new Image());
  });


  // callback for when all images have loaded
  var imLoadCallback = function() {
    console.log("done loading");
    _enable(continueButton);

    // Once you have loaded the images and know the size, set the correct display dimensions.
    // Assumes all images have the same height/width
    var shouldConstrainHeight = IMAGES[0].height/IMAGES[0].width > PARAMS.IMG_HEIGHT/PARAMS.IMG_WIDTH;
    if (shouldConstrainHeight) {
      $(".img-box").height(PARAMS.IMG_HEIGHT);
    } else {
      $(".img-box").width(PARAMS.IMG_WIDTH);
    }

  }
  // callback for every time a single image loads
  var imProgressCallback = function(imsLoaded, totalImsToLoad) {
    $("#im-load-progress").progress({'percent': imsLoaded/totalImsToLoad*100})
  }
  //onAllImagesLoaded(IMAGES.concat(CHAR_IMAGES).concat([cross]), imProgressCallback, imLoadCallback);
  onAllImagesLoaded(IMAGES, imProgressCallback, imLoadCallback);

  // start images loading
  cross.src = FIXATION_CROSS;
  $("#img-cross").attr("src", FIXATION_CROSS);
  data.forEach(function(e, i) {
    e.firstblock.images.forEach(function(imgPath, j){
		console.log("image path: "imgPath);
		IMAGES[i*PARAMS.NUM_IMGS_BLOCK*2+j].src =  imgPath;
	});
	e.secondblock.images.forEach(function(imgPath, j){
		IMAGES[i*PARAMS.NUM_IMGS_BLOCK*2+PARAMS.NUM_IMGS_BLOCK+j].src =  imgPath;
	});
    //IMAGES[i].src = IMAGE_BASE_PATH + elt.image;
    //CHAR_IMAGES[i].src = IMAGE_BASE_PATH + elt.codechart;
  });
	//console.log(IMAGES[1]);
}

function gupOrRandom(name, num) {
  /* Returns the value for the key `name` in the querystring if it exists,
   * else an int n s.t. 0 <= n < num. */
  var qs = gup(name);
  return qs.length > 0 ? parseInt(qs) : Math.floor(Math.random()*num);
}

function gup(name) {
  /* Searches for a querystring with key name. Returns the value or "". */
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var tmpURL = window.location.href;
    var results = regex.exec( tmpURL );
    if (results == null) return "";
    else return results[1];
}

function clickButtonOnEnter(inputElt, buttonToClick) {
  /* Set up a binding between the enter key and a specific button.
   *
   * If the user enters the enter key into `inputElt`, `buttonToClick`
   * will be clicked.
   */
  inputElt.unbind();
  inputElt.focus();

  // wait a little bit before re-adding the callback, otherwise
  // the callback could fire twice
  setTimeout(function() {
      inputElt.keyup(function(event) {
        if (event.keyCode === 13) { // 13 is the enter key
          buttonToClick.click();
        }
      });
  }, 500);
}

function onAllImagesLoaded(imgs, progressCallback, callback) {
  /*
   * Registers callbacks for when certain images are fully and partially loaded.
   *
   * This must be called BEFORE setting the `src` elements on imgs are set,
   * else the callback could be lost.
   *
   * imgs: an array of Image objects to watch. They should not have already started
   * loading, i.e. the `src` attribute should not yet be set.
   * progressCallback: Callback to be called every time an image loads. Takes two args:
   * the first is the number of images that have already loaded, the second is the total
   * number of images that will be loaded.
   * callback: Callback to be called when all images are loaded. Takes no args.
   *
   * returns: null
   */
  var imsToLoad = imgs.length;
  var numImsLoaded = 0;

  var incrementProgress = function() {
    numImsLoaded++;
    progressCallback(numImsLoaded, imsToLoad);
    if (numImsLoaded == imsToLoad) {
      callback();
      LOAD_TIME = new Date();
      console.log("Time to load secs", (LOAD_TIME - OPEN_TIME)/1000)
    }
  }

  var successHandler = function() {
    console.log("loaded an image");
    incrementProgress();
  }

  var errorHandler = function(event) {
    console.log("Error! ");
  }

  imgs.forEach(function(elt, i) {
    elt.onload = successHandler;
    elt.onerror = errorHandler;
  })
}

function _includes(arr, elt) {
  /* Checks if array `arr` contains element `elt`. */
  var idx = $.inArray(elt, arr);
  return idx != -1;
}

function _disable(button) {
  /* Disables button `button`. */
  button.addClass('disabled');
}

function _enable(button) {
  /* Enables button `button`. */
  button.removeClass('disabled');
}

function isTutorial(subtask) {
  /* Checks if `subtask` is part of the tutorial or not. */
  return subtask.flag == "tutorial_real" || subtask.flag == "tutorial_sentinel";
}

function didEndTutorial(taskInput, taskIndex, taskOutput) {
  /* Checks if the tutorial just finished. */
  return !isTutorial(taskInput[taskIndex]) && (taskIndex > 0 ? isTutorial(taskInput[taskIndex-1]) : true);
}

function isSentinel(subtask) {
  /* Checks if this subtask corresponds to a sentinel image. */
  return subtask.flag == "tutorial_sentinel" || subtask.flag == "sentinel";
}
