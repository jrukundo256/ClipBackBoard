//Clip'Back'Board

$(function() {
	// Переменные
	var $table =        $("#history-table"),
        $body =         $("body"),
        $wrap =         $("#wrap"),
		$btnClear =     $("#clear"),
        $btnRefresh =   $("#refresh"),

        $modal =        $("#modal"),
        $modalText =    $(".full-text"),
        $modalTitle =   $(".modal-title"),
        $modalLength =  $(".full-lenght span"),
        $modalDialog =  $(".modal-dialog"),
        $copyModal =    $("#modal-copy"),
        $deleteModal =  $("#modal-delete"),

        $triggerCopy    =  null,
        $triggerDelete  =  null;

	/* ********************************************************* */
	// Получаем историю буфера обмена
	_getClipboardHistory();
    // Обработчик на кнопку Очистить
    _btnClearOn();
    // Обработчик на кнопку Обновить
    _btnRefreshOn();
	/* ********************************************************* */
	// Получаем историю буфера обмена
	function _getClipboardHistory() {
        // Таблицу будем выводить наоборот
		var html = '',  // Сюда собираем строчку таблицы
            trArr = [], // Это массив строк таблицы, потом его перевернем
            clbObj = $.parseJSON(localStorage.clipboard);

        $.each(clbObj.list, function(ind, val) {
            if(!val.current) {
                html = '<tr>';
                html += '<td class="time-ago" data-date='+val.date+'>';
                html += '<span class="label label-default">'+moment(val.date).fromNow(true)+'</span></td>';
            } else {
                html = '<tr class="current">';
                html += '<td class="time-ago" data-date='+val.date+'>';
                html += '<span class="label label-success">'+moment(val.date).fromNow(true)+'</span></td>';
            }
            html += '<td class="paste-text"><div>'+encodeHTML(val.text)+ '</div></td>';

            html += '<td class="delete-text"><button class="btn btn-default btn-xs">' +
                    '<span class="fa fa-times text-muted"></span></button></td>';

            html += '<td class="show-text"><button class="btn btn-default btn-xs">' +
                '<span class="fa fa-eye text-muted"></span></button></td>';

            html += '<td class="count text-muted">(' +val.text.length+ ')</td>';

            html += '</tr>';

            trArr.push(html);
        });

		insertHTMLinTable(trArr.reverse().join()); // Выводим таблицу наоборот, т.е актуальная запись сверху
	}


    // Вставка HTML в таблицу истории
	function insertHTMLinTable(html) {
		$table.html(html);

        // Теперь запускаем обработку кликов на строку для копирования
        tdTextClickOn();
        // Запускаем обработчик для показа полного текст заметки
        showClickOn();
        // Запускаем обработчик на удаление этой записи
        deleteClickOn();
	}

    // Запускаем обработчик на кнопку очистить
    function _btnClearOn() {
        $btnClear.on('click', function() {
            localStorage.clear();
            $table.find("td.time-ago span:not(.label-success)").parent().parent().fadeOut(); //Король селекторов
        });
    }

    // При клике на строку таблицы - копируем текст в буфер
    function tdTextClickOn() {
        $("td.paste-text, td.time-ago").on('click', $table, function() {
            var $thisTr = $(this).parent(),
                $old = $("tr .label-success").parent().parent(),
                copyText;

            if(! $thisTr.hasClass('current')) {
                copyText = $thisTr.children('.paste-text').text();
                copyToClipboard(copyText); //Копируем в буфер

                // Меняем актуальность TR.
                changeCurrent($old, $thisTr); //Параметры (старый TR, новый TR)
            }
        });
    }

    // Копирование в буфер обмена
    function copyToClipboard(text) {
        $body.append('<textarea id="temp"/>');
        var $test = $('#temp');
        $test.text(text).select();
        document.execCommand('copy');
        $test.remove();
    }

    // Смена подсветки актуального контента в буфере
    function changeCurrent($old, $new) {
        $old
            .removeClass('current')
            .find(".label")
            .removeClass("label-success")
            .addClass("label-default");

        $new
            .addClass('current')
            .find(".label")
            .removeClass("label-default")
            .addClass("label-success")
            .text(function() {
                return moment(Date.now()).fromNow(true);
            });

        // Включаем/отключения кнопку удаления записи из истории
        $old.find("td.delete-text button").fadeIn();
        $new.find("td.delete-text button").hide();

        // Хороший сниппет подсветки TR-ки на CSS3
        $new.css({
            "transition-duration":"0s",
            backgroundColor:'#BFB'
        });
        setTimeout(function() {
            $new.css({
                transition:"background 1s linear",
                backgroundColor:'inherit'
            });
        },200);
    }

    // Обработчик на нажитие кнопки Обновить историю клипборда
    function _btnRefreshOn() {
        $btnRefresh.on('click', function() {
            $table.fadeOut({complete: function() {
                _getClipboardHistory();
                $table.fadeIn();
            }});
        });
    }

    // Перевод тегов в спецсимволы.
    function encodeHTML(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Показать полный текст записи
    function showClickOn() {
        $("td.show-text button").on('click', function() {
            var $thisTr = $(this).parent().parent(),
                $textTd = $thisTr.find(".paste-text"),
                dataText = $textTd.text(), // Текст для полной версии
                dataDate = $thisTr.find(".time-ago").data('date');  // Дата для полной версии

            $triggerCopy = $textTd;                                 // Если захотим скопировать из просмотра полной версии
            if($thisTr.hasClass('current')) {
                $deleteModal.attr('disabled',true);
            }
            else {
                $deleteModal.attr('disabled',false);
                $triggerDelete = $thisTr.find("td.delete-text button"); // Если захотим удалить из просмотра полной версии
            }


            dataDate = moment(dataDate).format('MMMM Do YYYY, HH:mm:ss');

            $modalText.text(dataText);
            $modalTitle.text(dataDate);
            $modalLength.text(dataText.length);

            $modal.modal();

            // Если попапп маленький - добавляем ему высоты
            if($body.height() < 300) {
                $body.addClass("body-ext");
            }
        });

        // Убираем дополнительную высоту
        $modal.on('hide.bs.modal',function() {
            if($body.hasClass("body-ext")) {
                $body.removeClass("body-ext");
            }
        });

        // Запуск обработчика для кнопки Скорировать в полной версии
        copyModalClickOn();
        // Запуск обработчика для кнопки Удалить в полной версии
        deleteModalClickOn();
    }

    // Обработчик на кнопку Копировать в просмотре полной версии текста
    function copyModalClickOn() {
        $copyModal.on('click', function() {
            $modal.modal('hide');
            $triggerCopy.trigger('click');
        });
    }

    // Обработчик на кнопку Копировать в просмотре полной версии текста
    function deleteModalClickOn() {
        $deleteModal.on('click', function() {
            $modal.modal('hide');
            $triggerDelete.trigger('click');
        });
    }

    // Обработчик на нажатие кнопки удаления
    function deleteClickOn() {
        $("td.delete-text button").on('click', function() {
            var $thisTr = $(this).parent().parent(),
                timeID = $thisTr.find(".time-ago").data('date');

                // Удаление одного элемента из истории буфера по его unix-времени
                if(deleteItem(timeID)) {
                  $thisTr.fadeOut();
                }
        });
    }

    // Функция удаления элемента из истории
    function deleteItem(timeID) {
        var clbObj = $.parseJSON(localStorage.clipboard),
            newObj = {},
            newVal = {};

        newObj['list'] = [];
        $.each(clbObj.list, function(ind, val) {
            if(val.date != timeID) {
                newVal = {}; // Тот самый момент, когда и без этой строчки должно работать, но не работает )
                newVal['text'] = val.text;
                newVal['date'] = val.date;
                newVal['current'] = val.current;

                newObj['list'].push(newVal);
            }
        });

        localStorage.clipboard = JSON.stringify(newObj);
        return true;
    }

    // Для дебага
    function log(msg) {
        console.log(msg);
    }
	
});