var App = {};
	App.tagsJson = "";

App.isOpen = false;
App.isGenerated = false

// Function to update the scrollable content height
function updateScrollableContentHeight() {
	var containerHeight = $('#right-frame').height();
	var totalToolbarHeight = 0;

	// Calculate the combined height of all toolbar elements
	$("#right-frame > div:not([id='result-panel'])").each(function() {
		totalToolbarHeight += $(this).outerHeight();
	});


	var scrollableContentHeight = containerHeight - totalToolbarHeight;
	
	$('#right-frame > #result-panel').css('max-height', scrollableContentHeight + 'px');
	}

$(document).ready(function() {
	// Initial call to set the height
	updateScrollableContentHeight();

	$('#separator').on('dragstop', updateScrollableContentHeight);
	$('#separator').on('dragstart', () => {
		$('#right-frame > #result-panel').css('max-height', 'none');
	});
  });

App.click = function() {
	if (!App.isOpen && !App.isGenerated) {
        App.showTags();
        App.getTags();
        App.isOpen = true;
        App.isGenerated = true;

    } else if (!App.isOpen) {
        App.showTags();
        App.isOpen = true;
		updateScrollableContentHeight();
    } else {
        App.hideTags();
        App.isOpen = false;
    }
}

/**
 * Tags
 */
App.tagSlug = function(tag) {
	var find = '\u00E1\u010D\u010F\u00E9\u011B\u00ED\u0148\u00F3\u0159\u0161\u0165\u00FA\u016F\u00FD\u017E';
	var repl = 'acdeeinorstuuyz';
	return tag.toLowerCase().replace(new RegExp('[' + find + ']', 'g'), function (str) { return repl[find.indexOf(str)]; });
}
App.removeTag = function(title) {
	var matchTags = App.matchTags(title);
	for(var i=0; i < matchTags.length; i++) {
		title = title.replace(new RegExp("("+matchTags[i]+")", 'gi'), '');
	}
	title.replace(/^\s+|\s+$/g, '');
	return title;
}
App.matchTags = function(title) {
	var matched = [];
	var matchTags = title.toLowerCase().match(/#(?![0-9])([^\s]*)/g); //  #([^\s]*)

	if(matchTags!=null) {
		for(var i=0; i < matchTags.length; i++) {
			matched.push(App.tagSlug(matchTags[i]));
		}
	}

	return matched;
}
App.processTag = function(node) {
	if(node.children) {
		node.children.forEach(function(child) {
			App.processTag(child);
		});
	}

	if(node.url) {
		
		var matchTags = App.matchTags(node.title);

		for(var i=1; i < matchTags.length; i++) {
			if($('#tags a[data-tag="'+matchTags[i]+'"]').size()==0) {

				// tags
				var tagElement = '<li><a href="#" class="label hashtag" data-tag="'+matchTags[i]+'">'+matchTags[i].replace("#", "")+'</a></li>';
				var added = false;
				$('#tags li a').each(function(){

					if($(this).text().replace("#", "") > matchTags[i].replace("#", "")) {
						$(tagElement).insertBefore($(this).parent());
						added = true;
						return false;
					}
				});
				if(!added) $(tagElement).appendTo($('#tags'));

				// editor
				var tagElement = '<li><a href="#" class="hashtag add-tag" data-tag="'+matchTags[i]+'">'+matchTags[i].replace("#", "")+'</a></li>';
				var added = false;
				$('#addTag li a').each(function(){

					if($(this).text().replace("#", "") > matchTags[i].replace("#", "")) {
						$(tagElement).insertBefore($(this).parent());
						added = true;
						return false;
					}
				});
				if(!added) $(tagElement).appendTo($('#addTag'));
			}
		}

	}
}

App.getTags = function(bookmark) {
	$('#tags').html('');
	$('#addTag').html('');

	chrome.bookmarks.getTree(function(itemTree){
		itemTree.forEach(function(item){
			App.processTag(item);
		});
		updateScrollableContentHeight();
	});

    $(document.body).on('click', 'li a.label', function(e){
		const searchInput = document.getElementById("search-editor");

        // Prevent the default behavior of the anchor element (e.g., following a link)
        e.preventDefault();

        // Access the data-tag attribute value
        var dataTagValue = $(this).attr('data-tag');
        
		let searchString = searchInput.value.slice(0, searchInput.selectionStart) + searchInput.value.slice(searchInput.selectionEnd);
		searchString = searchString.trim();
        searchString = searchString + ' ' + dataTagValue;
		searchInput.value = searchString.trim();

		searchInput.focus();

        search(true);
});
}

App.hideTags = function() {
    document.querySelector('.tags-wrap').style.display = "none";
    document.querySelector('.tags-wrap').style.height = "0";
	updateScrollableContentHeight()
}

App.showTags = function() {
    document.querySelector('.tags-wrap').style.display = "block";
    document.querySelector('.tags-wrap').style.height = "auto";
}

