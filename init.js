/*
Bookmarks-Chocmixin.
A Mixin for Chocolat to bookmark files anywhere on your systemfor single click/keystroke access.
https://github.com/franzheidl/bookmarks-chocmixin
Franz Heidl 2014
MIT License
*/


var fs = require('fs');
var win;


function debug(b) {
  if (typeof b === 'number') {
    b = b.toString();
  }
  else if (typeof b === 'object') {
    b = JSON.stringify(b);
  }
  Alert.show(b);
}


function getBookmarks() {
  var s = Storage.persistent().get('bookmarks');
  if (s === null) {
    return [];
  } else {
    return s;
  }
}


function openBookmark(p) {
  var exists;
  try {
    exists = fs.statSync(p);
    if (exists){
      Document.open(p, 'MainWindow');
      win.close();
    }
  }
  catch (err) {
    Alert.show('No such file or directory', p + ' seems to have been moved or deleted.');
  }
}


function addBookmark() {
  if (Document.current()) {
    if (Document.current().isUntitled()) {
      Alert.show('Unsaved Document.', 'Save your document first in order to bookmark.');
    } else {
      var currentPath = (Document.current()).path();
      if (currentPath) {
        var bookmarks = getBookmarks();
        var b = {path: currentPath};
        if (isUniqueBookmark(b)) {
          if (fs.lstatSync(currentPath).isFile()) {
            b.type = 'file';
          }
          else if (fs.lstatSync(currentPath).isDirectory()) {
            b.type = 'directory';
          }
          bookmarks.push(b);
          Storage.persistent().set('bookmarks', bookmarks);
        }
        else {
          Alert.show('Bookmark already exists:', b.path);
        }
        updateWin();
      }
    }
      
  }
  else {
    Alert.show('No open document to bookmark!');
  }
}

function clearBookmarks() {
  Storage.persistent().set('bookmarks', []);
  updateWin();
}

function removeBookmark(p) {
  var bkms = getBookmarks();
  var n = bkms.length;
  while (n--) {
    if (bkms[n].path === p) {
      bkms.splice(n, 1);
      Storage.persistent().set('bookmarks', bkms);
      updateWin();
    }
  }
}


function isUniqueBookmark(b) {
 var bookmarks = getBookmarks();
 if (bookmarks.length > 0) {
   var n = bookmarks.length;
   while (n--) {
     if (bookmarks[n].path === b.path) {
       return false;
     }
   }
 }
 return true;
}

function saveEditedBookmark(b) {
  var currentBookmarks = getBookmarks();
  b = JSON.parse(b);
  var oldPath = b.oldPath;
  var newPath = b.newPath;
  
  /* Check if file exists */
  if (fs.existsSync(newPath)) {
    var newBookmark = {};
    newBookmark.path = newPath;
    /* Find the index of the bookmark that is to be changed */
    var index;
    for (var z = 0; z < currentBookmarks.length; z++) {
      if (currentBookmarks[z].path === oldPath) {
        index = z;
      }
    }
    /* Determine the type */
    var type;
    if (fs.lstatSync(newPath).isFile()) {
      type = 'file';
    }
    else if (fs.lstatSync(newPath).isDirectory()) {
      type = 'directory';
    }
    newBookmark.type = type;
    /* If the bookmark is unique, save it */
    if (isUniqueBookmark(newBookmark)) {
      var newBookmarks = currentBookmarks;
      newBookmarks[index] = newBookmark;
      Storage.persistent().set('bookmarks', newBookmarks);
      updateWin();
    }
    /* if the new bookmark is not unique, alert */
    else {
      if (oldPath !== newPath) {
        Alert.show('Bookmark already exists.', newBookmark.path);
      }
      else {
        updateWin();
      }
    }
  } else {
    Alert.show('Invalid Path:', newPath);
  }
  
  
}

function updateWin() {
  
  if (win) {
  
  var bookmarks = getBookmarks();
  win.applyFunction(function(bookmarks) {
    var bookmarksContainer = document.getElementById('bookmarks');
    var selectedBookmark = document.getElementById('selected');
    var searchField = document.getElementById('search');
    var path,
        name,
        displayPath;
        
          
    searchField.focus();
    
    function getTarget(t) {
      while(t.tagName !== 'LI') {
        t = t.parentNode;
      }
      return t;
    }
    
    function isEditing() {
      var editing = document.querySelector('.editable');
      if (editing === null) {
        return false;
      }
      else {
        return editing;
      }
    }
    
    var getFirstNodeWithoutClass = function(nodes, c) {
      var nodesArray = [];
      for (var x = 0; x < nodes.length; x++) {
        nodesArray[x] = nodes[x];
      }
      var firstNodeWithoutClass = false;
      for (var i = 0; i < nodesArray.length; i++) {
        if (nodesArray[i].classList.contains(c) !== true) {
          firstNodeWithoutClass = nodesArray[i];
          break;
        }
      }
      return firstNodeWithoutClass;
    };
    
    var getPreviousSiblingWithoutClass = function(n, c) {
      var siblings = n.parentNode.childNodes;
      var siblingsArray = [];
      for (var x = 0; x < siblings.length; x++) {
        siblingsArray[x] = siblings[x];
      }
      var previousSiblings = siblingsArray.slice(0, siblingsArray.indexOf(n));
      var previousSiblingWithoutClass = false;
      var i = previousSiblings.length;
      while (i--) {
        if (previousSiblings[i].classList.contains(c) !== true) {
          previousSiblingWithoutClass = previousSiblings[i];
          break;
        }
      }
      return previousSiblingWithoutClass;
    };
    
    var getNextSiblingWithoutClass = function(n, c) {
      var siblings = n.parentNode.childNodes;
      var siblingsArray = [];
      for (var x = 0; x < siblings.length; x++) {
        siblingsArray[x] = siblings[x];
      }
      var nextSiblings = siblingsArray.slice((siblingsArray.indexOf(n)) + 1);
      var nextSiblingWithoutClass = false;
      for (var i = 0; i < nextSiblings.length; i++) {
        if (nextSiblings[i].classList.contains(c) !== true) {
          nextSiblingWithoutClass = nextSiblings[i];
          break;
        }
      }
      return nextSiblingWithoutClass;
    };
    
    var filterList = function(e) {
      var searchString = e.target.value;
      var selectedBookmark = document.getElementById('selected');
      var items = bookmarksContainer.childNodes;
      var i = items.length;
      var txt;
      while (i--) {
        txt = items[i].querySelector('input').value;
        if (txt.toLowerCase().indexOf(searchString.toLowerCase()) === -1) {
          items[i].classList.add('hidden');
        }
        else {
          items[i].classList.remove('hidden');
        }
      }
      var newSelectedBookmark = getFirstNodeWithoutClass(items, 'hidden');
      newSelectedBookmark.setAttribute('id', 'selected');
      if (selectedBookmark !== newSelectedBookmark) {
        selectedBookmark.removeAttribute('id', 'selected');
      }
      selectedBookmark = newSelectedBookmark;
    };
    
    window.select = function(e) {
      e.stopPropagation();
      var selected = document.getElementById('selected');
      var target = getTarget(e.target);
      if (target !== selected) {
        target.setAttribute('id', 'selected');
        selected.removeAttribute('id');
        var editing = isEditing();
        if (editing) {
          if (editing !== target) {
            editing.classList.remove('editable');
            searchField.focus();
          }
        }
        else {
          searchField.focus();
        }
      }
    };
    
    window.open = function(e) {
      var target = getTarget(e.target);
      chocolat.sendMessage('open', target.querySelector('input').value);
    };
    
    window.remove = function(e) {
      var target = getTarget(e.target);
      chocolat.sendMessage('remove', target.querySelector('input').value);
    };
    
    window.edit = function(e) {
      e.preventDefault();
      var target = getTarget(e.target);
      var editing = isEditing();
      if (editing) {
        editing.classList.remove('editable');
      }
      target.classList.add('editable');
      var inputField = target.querySelector('input');
      inputField.focus();
    };
    
    window.cancelEdit = function(e) {
      var target = getTarget(e.target);
      var inputField = target.querySelector('input');
      target.classList.remove('editable');
      inputField.value = target.getAttribute('data-path');
      searchField.focus();
    };
    
    window.saveEdit = function(e) {
      e.preventDefault();
      var target = getTarget(e.target);
      var inputField = target.querySelector('input');
      var oldPath = target.getAttribute('data-path');
      var newPath = inputField.value.trim();
      if (oldPath !== newPath) {
        chocolat.sendMessage('save', '{"oldPath":"' + oldPath + '", "newPath":"' + newPath + '"}');
      } else {
        cancelEdit(event);
      }
    };
    
    window.userInput = function(e) {
      filterList(e);
    };
    
    window.userKeyPressed = function(e) {
      var selectedBookmark = document.getElementById('selected');
      var buttonBarHeight = 36;
      var newSelectedBookmark;
      
      /* ESC -> close window or unfocus search field TODO: check if there is any editable and un-editable it first! */
      if (e.keyCode === 27) {
        e.preventDefault();
        if (searchField.value.length > 0) {
          searchField.value = '';
          filterList(e);
        }
        else {
          chocolat.sendMessage('close', []);
        }
      }
      
      /* ctrl-alt-b -> Add Bookmark */
      /* only fire if user has not pressed alt-cmd-ctrl-b */
      else if (e.keyCode === 66 && e.ctrlKey && e.altKey && !e.metaKey) {
        e.preventDefault();
        chocolat.sendMessage('add', []);
      }
      
      /* Return/Enter -> Open selected bookmark */
      else if (e.keyCode === 13) {
        e.preventDefault();
        chocolat.sendMessage('open', selected.querySelector('input').value);
      }
      
      /* Arrow down -> Move selection down and scroll if necessary */
      else if (e.keyCode === 40) {
        e.preventDefault();
        if (selectedBookmark.nextSibling) {
          newSelectedBookmark = getNextSiblingWithoutClass(selectedBookmark, 'hidden');
          newSelectedBookmark.setAttribute('id', 'selected');
          if (selectedBookmark !== newSelectedBookmark) {
            selectedBookmark.removeAttribute('id');
            selectedBookmark = newSelectedBookmark;
          }
        }
        /* Scroll down */
        var viewPort = window.pageYOffset + window.innerHeight - buttonBarHeight;
        var selectedRect = selectedBookmark.getBoundingClientRect();
        var selectedBottom = selectedBookmark.offsetTop + selectedRect.height;
        if (selectedBottom > viewPort) {
          window.scrollTo(0, (selectedBottom - (window.innerHeight - buttonBarHeight)));
        }
      }
      
      /* Arrow up -> Move selection up and scroll if necessary */
      else if (e.keyCode === 38) {
        e.preventDefault();
        if (selectedBookmark.previousSibling) {
          newSelectedBookmark = getPreviousSiblingWithoutClass(selectedBookmark, 'hidden');
          newSelectedBookmark.setAttribute('id', 'selected');
          if (selectedBookmark !== newSelectedBookmark) {
            selectedBookmark.removeAttribute('id');
            selectedBookmark = newSelectedBookmark;
          }
        }
        /* Scroll up */
        if (selectedBookmark.offsetTop < (window.pageYOffset + buttonBarHeight)) {
          window.scrollTo(0, selectedBookmark.offsetTop - buttonBarHeight);
        }
      }
      
      
    };
    
    window.userEditKeyPressed = function(e) {
      
      /* ESC -> Cancel editing */
      if (e.keyCode === 27) {
        e.preventDefault();
        window.cancelEdit(event);
      }
      
      /* Enter/Return -> Save editing */
      else if (e.keyCode === 13) {
        e.preventDefault();
        window.saveEdit(event);
      }
      
    };
    
    
    /* Clear the DOM */
    while (bookmarksContainer.lastChild) {
      bookmarksContainer.removeChild(bookmarksContainer.lastChild);
    }
    
    var html = '';
        
    /* Create the DOM */
    if (bookmarks.length === 0) {
      html += '<li><span class="no-bookmarks">No bookmarks saved yet</span></li>';
      bookmarksContainer.innerHTML = html;
    } else {
      var b = bookmarks.length;

      while (b--) {
        html = '';
        path = bookmarks[b].path;
        
        if (path.substr(-1) === '/') {
          displayPath = path.substr(0, path.length - 1);
        }
        else {
          displayPath = path;
        }
        name = displayPath.split('/').pop();
        
        if (displayPath.substr(0, 1) === '/') {
          displayPath = displayPath.substr(1);
        }
        
        displayPath = displayPath.replace(/\//g, '<span class="path-delim">' + ' ' + '\u25b6' + ' ' + '</span>');
          
        //select first item:
        if (b === (bookmarks.length - 1)) {
          html += '<li id="selected" data-path="' + path + '">';

        }
        else {
          html += '<li data-path="' + path + '">';
        }
        
        // remove icon

        html += '<span class="remove"><span class="remove-icon" onclick="remove(event)"></span></span>';
      
        // bookmark icon
        
        html += '<span class="icon">';
        
        // type icon
        if (bookmarks[b].type === 'file') {
          html += '<span class="file-icon"></span>';
        }
        else if (bookmarks[b].type === 'directory') {
          html += '<span class="folder-icon"></span>';
        }
        
        html += '</span>';
        
        
        // INFO
        
        html += '<span class="info">';
        
        // info-title
        html += '<span class="info-name">' + name + '</span>';
        
        // info-path
        html += '<span class="info-path">' + displayPath + '</span>';
        
        // info-path-input
        html += '<input type="text" onkeydown="userEditKeyPressed(event)" value="' + path + '">';
        
        html += '</span>';
        
        
        // EDIT
        
        html += '<span class="edit">';
        
        // edit icon
        html += '<span class="edit-icon" onclick="edit(event)"></span>';
        
        // cancel icon
        html += '<span class="cancel-icon" onclick="cancelEdit(event)"></span>';
        
        // save icon
        html += '<span class="save-icon" onclick="saveEdit(event)"></span>';
                
        html += '</span>';
        
        html += '</li>';
        
        bookmarksContainer.innerHTML += html;
        
      }
      
      var bookmarkItems = bookmarksContainer.childNodes;
      
      for (var i = 0; i < bookmarkItems.length; i++) {
        bookmarkItems[i].addEventListener('click', select, false);
        bookmarkItems[i].addEventListener('dblclick', open, false);
      }
      
    }
            
  }, [bookmarks]);
}
}


function showBookmarks() {
  if (!win || win === undefined) {
    win = new Window();
    win.htmlPath = './html/bookmarks.html';
    win.title = 'Bookmarks';
    win.buttons = ['Add Bookmark', 'Clear all Bookmarks','Close[Esc]'];
    
    win.onLoad = function() {
      updateWin();
    };
    
    win.onUnload = function() {
      win = undefined;
    };
    
    win.onMessage = function(message) {
      var arg;
      if (arguments) {
        arg = arguments['1'];
      }
      if (message === 'remove') {
        removeBookmark(arg);
      }
      else if (message === 'open') {
        openBookmark(arg);
      }
      else if (message === 'close') {
        win.close();
      }
      else if (message === 'add') {
        addBookmark();
      }
      else if (message === 'save') {
        saveEditedBookmark(arg);
      }
      else if (message === 'debug') {
        debug(arg);
      }
    };
    
    win.onButtonClick = function(button) {
      if (button == 'Add Bookmark') {
        addBookmark();
      }
      else if (button == 'Clear all bookmarks') {
        clearBookmarks();
        updateWin();
      }
      else if (button == 'Close[Esc]') {
        win.close();
      }
    };
    
    win.run();
  }
  else {
    win.show();
  }
  
}


/* Hook'em in */

Hooks.addMenuItem('Go/Bookmarks/Bookmark File', 'alt-ctrl-b', function() {
  addBookmark();
});


Hooks.addMenuItem('Go/Bookmarks/Show Bookmarks', 'alt-cmd-ctrl-b', function() {
  showBookmarks();
});

Hooks.addMenuItem('Go/Bookmarks/Clear all Bookmarks', '', function() {
  clearBookmarks();
});

Hooks.addMenuItem('Go/Bookmarks/Debug Bookmarks', 'alt-cmd-ctrl-b', function() {
  var bookmarks = getBookmarks();
  Alert.show('Bookmarks', JSON.stringify(getBookmarks()));
});
