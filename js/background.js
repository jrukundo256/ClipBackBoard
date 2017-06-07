//Clip'Back'Board

$(function() {
    // Переменные и кеширование
    var $text = $("#text"),
        isNull = true;

    /* ********************************************************* */

    // Основной цикл
    _mainInit();

    /* ********************************************************* */
    // Основной цикл
    function _mainInit() {
        setInterval(function() {
            $text.focus().val("");
            document.execCommand('paste');
            var text = $text.val(); // (:

            checkText(text);
        },300);
    }

    // Проверка текста из буфера обмена
	function checkText(text) {

        // Если в хранилище уже есть история буфера обмена
		if(localStorage.clipboard) {
            var clbObj = $.parseJSON(localStorage.clipboard), // Получаем JSON из хранилища и переводим его в объект
                isExist = false, // Создаем флаг существования текста в истории
                needRewrite = false; // Флаг перезаписи. Нужен если что-то поменялось

            if(text) { // А текст ли это вообще?
                // Перебираем массив объектов 'list', проверяя, есть ли уже такой текст
                $.each(clbObj.list, function(ind, val) {
                    if(val.text === text) { // Находим тот же текст
                        isExist = true;
                        isNull = false;
                        // Если текст был неактивным - помечаем таковым
                        if(!val.current) {
                            val.current = true;
                            val.date = Date.now();
                            needRewrite = true;
                        }
                    }
                    else {
                        val.current = false;
                    }
                });

                // И так, текст не существует, тогда добавляем его в историю буфера
                if(!isExist) {
                    var addVal = {};
                    addVal["date"] = Date.now();
                    addVal["text"] = text;
                    addVal["current"] = true;

                    clbObj.list.push(addVal); // Добавляем объект в массив объектов
                    isNull = false;
                    needRewrite = true;
                }

            }
            else { // Нет, это не текст
                if(!isNull) { // Случай "пустоты" обработан?
                    // Очищаем Current у всех запсией.
                    $.each(clbObj.list, function(ind, val) {
                        val.current = false;
                    });

                    // Устанавливаем флаг перезаписи
                    needRewrite = true;
                    isNull = true; // Указываем на то, что обработали этот случай
                }
            }

            // Проверяем на нужность перезаписи
            if(needRewrite) {
                localStorage.clipboard = JSON.stringify(clbObj);
            }
		}
        // Если истории нет - это первый запуск. Создаем историю буфера.
		else {
            // Создаем историю в локалсторадже
            firstInit(text);
		}
	}

    // Функция первого запуска: создаем структуру хранилища
    function firstInit(text) {
        /*
         Логика такова: создаем объект, в нем массив.
         Элементы массива - это текст и дата, когда он был добавлен и метка об активности
         Затем объект преобразуем в JSON и добавляем в хранилище.
         */
        if(text) {
            var newVal = {}, // Значение
                newObj = {}; // Объект

            newVal["date"] = Date.now(); // Дата в Unix формате
            newVal["text"] = text; // Текст
            newVal["current"] = true; // Помечаем как текущий

            newObj['list'] = []; // В объекте создаем массив объектов под названием 'list'
            newObj['list'].push(newVal); // Добавляем в массив list значение

            // Переводим в JSON и добавляем в Local Storage
            localStorage.clipboard = JSON.stringify(newObj);
        }
    }

	function log(msg) {
		console.log(msg);
	}
});