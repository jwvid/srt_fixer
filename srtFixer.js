function removeLeadingSpacesAndFixTiming(srtData, removeDots) {
  var newLines = [];
  var modifiedSubs = [];
  var lastEndTime = null;

  var lines = srtData.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    if (line.includes('-->')) {
      var timeStrings = line.split('-->');
      var startTimeString = timeStrings[0].trim();
      var endTimeString = timeStrings[1].trim();

      var startTime = parseSrtTimestamp(startTimeString);
      var endTime = parseSrtTimestamp(endTimeString);

      if (lastEndTime !== null && startTime < lastEndTime) {
        startTime = lastEndTime;
        if (newLines[newLines.length - 1].trim().match(/^\d+$/)) {
          modifiedSubs.push(newLines[newLines.length - 1].trim());
        }
      }

      lastEndTime = endTime;

      line = formatSrtTimestamp(startTime) + ' --> ' + formatSrtTimestamp(endTime);
    } else if (line.trim() !== '') {
      line = line.trim();
      if (removeDots && line.endsWith('.')) {
        line = line.substring(0, line.length - 1);
      }
    }

    newLines.push(line);
  }

  return { fixedSrtData: newLines.join('\n'), modifiedSubs: modifiedSubs };
}

function parseSrtTimestamp(timestampStr) {
  var [time, milliseconds] = timestampStr.split(',');
  var [hours, minutes, seconds] = time.split(':').map(function (part) {
    return parseInt(part, 10);
  });

  var totalMilliseconds = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000) + (seconds * 1000) + parseInt(milliseconds, 10);
  return new Date(totalMilliseconds);
}

function formatSrtTimestamp(timestamp) {
  var formatted = timestamp.toISOString().substr(11, 12).replace('.', ',');
  return formatted;
}

document.querySelector('#convert').addEventListener('click', function () {
  var file = document.querySelector('#upload').files[0];
  var removeDots = document.getElementById('dotRemovalCheckbox').checked;
  console.log('마침표 제거 체크박스 상태:', removeDots);

  if (file) {
    var reader = new FileReader();
    reader.onload = function (event) {
      var result = removeLeadingSpacesAndFixTiming(event.target.result, removeDots);
      var blob = new Blob([result.fixedSrtData], { type: 'text/plain' });
      var url = URL.createObjectURL(blob);

      var downloadLink = document.querySelector('#download');
      downloadLink.href = url;
      downloadLink.download = file.name.replace('.srt', '_fixed.srt');

      downloadLink.classList.remove('fade');
      downloadLink.classList.add('show');

      var modifiedLines = result.modifiedSubs.map(function (line) {
        return (line - 1).toString();
      }).join(', ');

      var resultArea = document.querySelector('#result');
      var message = modifiedLines.length > 0 ? '다음 줄들이 수정되었습니다 : ' + modifiedLines : '원본 SRT에 타이밍 수정될 곳이 없었습니다.';
      resultArea.innerText = message;
      resultArea.textContent = message;

      downloadLink.classList.add('animate__animated');
    };
    reader.readAsText(file, 'UTF-8');
  } else {
    console.log('No file selected');
  }
});
