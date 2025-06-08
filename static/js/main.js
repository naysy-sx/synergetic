function initTelMasks() {
	const telInputs = document.querySelectorAll('input[type="tel"]');
	const maskOptions = { mask: '+{7}(000)000-00-00' };

	telInputs.forEach(input => {
		// Проверяем, что маска еще не применена
		if (!input.dataset.maskApplied) {
			IMask(input, maskOptions);
			input.dataset.maskApplied = 'true';
		}
	});
}

// Вызываем после загрузки DOM


$(document).ready(function () {

	initTelMasks();

	// Класс для управления модальными окнами
	class ModalManager {
		constructor() {
			this.init();
		}

		init() {
			this.bindEvents();
		}

		// Привязка событий
		bindEvents() {
			// Открытие модального окна
			$(document).on('click', '[data-open-modal]', (e) => {
				e.preventDefault();
				const modalId = $(e.currentTarget).data('open-modal');
				this.openModal(modalId);
			});

			// Закрытие по кнопке
			$(document).on('click', '[data-close-modal]', (e) => {
				e.preventDefault();
				const modal = $(e.currentTarget).closest('dialog')[0];
				this.closeModal(modal);
			});

			// Закрытие по клику на backdrop
			$(document).on('click', 'dialog', (e) => {
				if (e.target.tagName === 'DIALOG') {
					this.closeModal(e.target);
				}
			});

			// Закрытие по ESC (нативная поддержка + кастомная анимация)
			$(document).on('keydown', (e) => {
				if (e.key === 'Escape') {
					const openModal = $('dialog[open]')[0];
					if (openModal) {
						e.preventDefault(); // Предотвращаем нативное закрытие
						this.closeModal(openModal);
					}
				}
			});
		}

		// Открытие модального окна
		openModal(modalId) {
			const modal = document.getElementById(modalId);
			if (!modal) {
				console.error(`Modal with ID "${modalId}" not found`);
				return;
			}

			// Добавляем класс к body для предотвращения скролла
			$('body').addClass('modal-open');

			// Открываем модальное окно
			modal.showModal();

			// Фокус на первый интерактивный элемент
			setTimeout(() => {
				this.focusFirstElement(modal);
			}, 100);

			// Триггерим кастомное событие
			$(modal).trigger('modal:opened');
		}

		// Закрытие модального окна
		closeModal(modal) {
			if (!modal || !modal.open) return;

			const $modal = $(modal);

			// Добавляем класс для анимации закрытия
			$modal.addClass('closing');

			// Закрываем модальное окно после анимации
			setTimeout(() => {
				modal.close();
				$modal.removeClass('closing');
				$('body').removeClass('modal-open');

				// Триггерим кастомное событие
				$modal.trigger('modal:closed');
			}, 300);
		}

		// Установка фокуса на первый интерактивный элемент
		focusFirstElement(modal) {
			const focusableElements = modal.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);

			if (focusableElements.length > 0) {
				focusableElements[0].focus();
			}
		}

		// Публичные методы для программного управления
		open(modalId) {
			this.openModal(modalId);
		}

		close(modalId) {
			const modal = document.getElementById(modalId);
			if (modal) {
				this.closeModal(modal);
			}
		}

		closeAll() {
			$('dialog[open]').each((index, modal) => {
				this.closeModal(modal);
			});
		}
	}

	// Инициализация менеджера модальных окон
	window.modalManager = new ModalManager();

	// Дополнительные утилиты

	// Функция для создания модального окна программно
	window.createModal = function (options = {}) {
		const {
			id = 'dynamic-modal-' + Date.now(),
			title = 'Modal',
			content = '',
			size = 'default', // small, default, large, fullscreen
			closeButton = true,
			className = ''
		} = options;

		const modalHTML = `
      <dialog class="modal ${size !== 'default' ? 'modal--' + size : ''} ${className}" id="${id}">
        ${closeButton ? `
          <button class="modal__close" data-close-modal>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        ` : ''}
        <div class="modal__content">
          <h2>${title}</h2>
          ${content}
        </div>
      </dialog>
    `;

		$('body').append(modalHTML);
		return document.getElementById(id);
	};

	// Функция для подтверждения
	window.confirmModal = function (message, title = 'Подтверждение') {
		return new Promise((resolve) => {
			const modalId = 'confirm-modal-' + Date.now();
			const content = `
        <p>${message}</p>
        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;">
          <button class="btn btn--secondary" data-confirm-cancel>Отмена</button>
          <button class="btn btn--primary" data-confirm-ok>Подтвердить</button>
        </div>
      `;

			const modal = createModal({
				id: modalId,
				title: title,
				content: content,
				size: 'small',
				closeButton: false
			});

			$(modal).on('click', '[data-confirm-ok]', () => {
				modalManager.close(modalId);
				setTimeout(() => $(modal).remove(), 350);
				resolve(true);
			});

			$(modal).on('click', '[data-confirm-cancel]', () => {
				modalManager.close(modalId);
				setTimeout(() => $(modal).remove(), 350);
				resolve(false);
			});

			modalManager.open(modalId);
		});
	};
});

// Пример использования:
/*
// Простое открытие модального окна
modalManager.open('modal-1');

// Создание динамического модального окна
const modal = createModal({
	title: 'Новое окно',
	content: '<p>Содержимое модального окна</p>',
	size: 'large'
});
modalManager.open(modal.id);

// Модальное окно подтверждения
confirmModal('Вы уверены, что хотите удалить этот элемент?')
	.then(result => {
		if (result) {
			console.log('Пользователь подтвердил');
		} else {
			console.log('Пользователь отменил');
		}
	});
*/