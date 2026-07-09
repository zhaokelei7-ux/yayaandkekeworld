/**
 * 自定义确认弹窗（替代浏览器 confirm）
 * 悲伤蓝灰色主题
 * @param {string} message - 显示的消息
 * @param {string} [title] - 标题（可选）
 * @returns {Promise<boolean>} true=确认, false=取消
 */
export function showConfirmModal(message, title) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    const titleEl = modal.querySelector('.modal-title');
    const msgEl = modal.querySelector('.modal-msg');
    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');

    // 设置内容
    titleEl.textContent = title || '⚠️ 确认操作';
    msgEl.innerHTML = message.replace(/\n/g, '<br>');

    // 移除旧监听器
    const newCancel = cancelBtn.cloneNode(true);
    const newConfirm = confirmBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);

    // 显示弹窗
    modal.classList.remove('modal-hidden');

    newCancel.addEventListener('click', () => {
      modal.classList.add('modal-hidden');
      resolve(false);
    });

    newConfirm.addEventListener('click', () => {
      modal.classList.add('modal-hidden');
      resolve(true);
    });

    // 点击遮罩层也取消
    const overlay = modal.querySelector('.modal-overlay');
    const overlayHandler = () => {
      modal.classList.add('modal-hidden');
      modal.querySelector('.modal-overlay').removeEventListener('click', overlayHandler);
      resolve(false);
    };
    overlay.addEventListener('click', overlayHandler);
  });
}
