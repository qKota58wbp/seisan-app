// グローバル変数（アプリ全体で使うデータ）
let participants = []; // 参加者の名前リスト (例: ['鈴木', '佐藤'])
let expenses = [];     // 支払い情報のリスト (例: [{ payer: '鈴木', amount: 1000, description: '高速代' }])

// --- DOM要素の取得 ---
const participantNameInput = document.getElementById('participantName');
const addParticipantButton = document.getElementById('addParticipantButton');
const participantListElement = document.getElementById('participantList');
const payerSelect = document.getElementById('payer');
const amountInput = document.getElementById('amount');
const descriptionInput = document.getElementById('description');
const addExpenseButton = document.getElementById('addExpenseButton');
const expenseListElement = document.getElementById('expenseList');
const calculateButton = document.getElementById('calculateButton');
const resultArea = document.getElementById('resultArea');
const summaryTextElement = document.getElementById('summaryText');
const balanceListElement = document.getElementById('balanceList');
const transactionListElement = document.getElementById('transactionList');
const resetButton = document.getElementById('resetButton');

// --- イベントリスナーの設定 ---
addParticipantButton.addEventListener('click', addParticipant);
participantNameInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        addParticipant();
    }
});
addExpenseButton.addEventListener('click', addExpense);
calculateButton.addEventListener('click', calculateFinalSettlement);
resetButton.addEventListener('click', resetApp);

// スマホでの入力フィールドのフォーカス解除イベント追加
document.querySelectorAll('input, select').forEach(element => {
    element.addEventListener('blur', function() {
        // 少し遅延させてページスクロールに対応
        setTimeout(() => {
            window.scrollTo(0, window.scrollY);
        }, 100);
    });
});

// タッチデバイス検出
const isTouchDevice = () => ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// --- 関数定義 ---

/**
 * 参加者を追加する関数
 */
function addParticipant() {
    const name = participantNameInput.value.trim();
    if (name && !participants.includes(name)) {
        participants.push(name);
        renderParticipantList();
        updatePayerOptions();
        participantNameInput.value = '';
    } else if (!name) {
        alert('参加者の名前を入力してください。');
    } else {
        alert('同じ名前の参加者が既に存在します。');
    }
    participantNameInput.focus();
}

/**
 * 参加者リストをHTMLに描画する関数
 */
function renderParticipantList() {
    participantListElement.innerHTML = '';
    participants.forEach((name, index) => {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        li.appendChild(nameSpan);
        
        const deleteBtn = createDeleteButton(() => removeParticipant(index));
        li.appendChild(deleteBtn);
        participantListElement.appendChild(li);
    });
}

/**
 * 参加者を削除する関数
 */
function removeParticipant(indexToRemove) {
    const removedParticipant = participants[indexToRemove];
    if (confirm(`${removedParticipant}を削除しますか？`)) {
        // この参加者が関与する支払いを削除
        expenses = expenses.filter(expense => expense.payer !== removedParticipant);
        // 参加者リストから削除
        participants.splice(indexToRemove, 1);

        // 再描画
        renderParticipantList();
        updatePayerOptions();
        renderExpenseList(); // 支払いリストも更新
        resultArea.style.display = 'none'; // 結果表示を隠す
    }
}

/**
 * 支払い選択肢（<select>）を更新する関数
 */
function updatePayerOptions() {
    const originalValue = payerSelect.value;
    payerSelect.innerHTML = '<option value="">--選択してください--</option>';
    participants.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        payerSelect.appendChild(option);
    });
    if (participants.includes(originalValue)) {
        payerSelect.value = originalValue;
    }
}

/**
 * 支払い情報を追加する関数
 */
function addExpense() {
    const payer = payerSelect.value;
    const amount = parseFloat(amountInput.value);
    const description = descriptionInput.value.trim();

    // 入力チェック
    if (!payer) { alert('支払った人を選択してください。'); return; }
    if (isNaN(amount) || amount <= 0) { alert('有効な金額を入力してください。'); return; }
    if (!description) { alert('内容を入力してください。'); return; }

    // 支払い情報をexpenses配列に追加
    expenses.push({ payer, amount, description });
    renderExpenseList();

    // 入力欄をクリア
    amountInput.value = '';
    descriptionInput.value = '';
    amountInput.focus();
    
    // スマホでは自動スクロールして入力欄を見やすく
    if (isTouchDevice()) {
        amountInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * 支払いリストをHTMLに描画する関数
 */
function renderExpenseList() {
    expenseListElement.innerHTML = '';
    expenses.forEach((expense, index) => {
        const li = document.createElement('li');
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'expense-content';
        contentDiv.textContent = `${expense.description}: ${expense.amount.toLocaleString()}円 (${expense.payer})`;
        li.appendChild(contentDiv);
        
        const deleteBtn = createDeleteButton(() => removeExpense(index));
        li.appendChild(deleteBtn);
        expenseListElement.appendChild(li);
    });
}

/**
 * 支払い情報を削除する関数
 */
function removeExpense(indexToRemove) {
    const expense = expenses[indexToRemove];
    if (confirm(`${expense.description}（${expense.amount.toLocaleString()}円）を削除しますか？`)) {
        expenses.splice(indexToRemove, 1);
        renderExpenseList();
        resultArea.style.display = 'none'; // 結果表示を隠す
    }
}

/**
 * 削除ボタンを作成する共通関数
 * アイコンフォントを使ったボタンを生成するように変更
 */
function createDeleteButton(onClickAction) {
    const button = document.createElement('button');
    button.className = 'delete-btn';
    button.title = '削除';
    // アイコン(<i>タグ)をinnerHTMLで設定
    button.innerHTML = '<i class="fas fa-trash-alt"></i>'; 
    button.addEventListener('click', function(event) {
        event.stopPropagation();
        onClickAction();
    });
    return button;
}

/**
 * 精算計算を実行し、結果を表示する関数
 */
function calculateFinalSettlement() {
    if (participants.length < 2) {
        alert('精算するには参加者が2人以上必要です。');
        return;
    }
    if (expenses.length === 0) {
        alert('支払い情報がありません。');
        return;
    }

    // 1. 各個人の収支を計算
    const balances = {};
    participants.forEach(p => balances[p] = 0);

    let totalAmount = 0;
    expenses.forEach(expense => {
        balances[expense.payer] += expense.amount;
        totalAmount += expense.amount;
    });

    const amountPerPerson = totalAmount / participants.length;

    participants.forEach(p => {
        balances[p] -= amountPerPerson;
    });

    // 2. 収支リストを表示
    balanceListElement.innerHTML = '';
    participants.forEach(p => {
        const li = document.createElement('li');
        const balance = balances[p];
        const balanceText = balance >= 0
            ? `+${Math.round(balance).toLocaleString()} 円 (受取)`
            : `${Math.round(balance).toLocaleString()} 円 (支払)`;
        li.textContent = `${p}: ${balanceText}`;
        li.classList.add(balance >= 0 ? 'positive' : 'negative');
        balanceListElement.appendChild(li);
    });

    // 概要を表示
    summaryTextElement.innerHTML = `<strong>合計金額:</strong> ${Math.round(totalAmount).toLocaleString()}円<br><strong>一人あたり:</strong> ${Math.round(amountPerPerson).toLocaleString()}円`;

    // 3. 支払いを計算
    const transactions = calculateTransactions(balances);

    // 4. 精算リストを表示
    transactionListElement.innerHTML = '';
    if (transactions.length === 0) {
        const li = document.createElement('li');
        li.textContent = '精算の必要はありません。';
        transactionListElement.appendChild(li);
    } else {
        transactions.forEach(t => {
            const roundedAmount = Math.round(t.amount);
            if (roundedAmount > 0) {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${t.from}</strong> <i class="fas fa-long-arrow-alt-right"></i> <strong>${t.to}</strong> に <strong>${roundedAmount.toLocaleString()} 円</strong> 支払う`;
                transactionListElement.appendChild(li);
            }
        });
        if (transactionListElement.children.length === 0) {
            const li = document.createElement('li');
            li.textContent = '精算の必要はありません（端数は無視されました）。';
            transactionListElement.appendChild(li);
        }
    }

    // 結果エリア全体を表示
    resultArea.style.display = 'block';
    setTimeout(() => {
        resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

/**
 * 精算取引を計算するアルゴリズム
 */
function calculateTransactions(balances) {
    const transactions = [];
    const debtors = [];
    const creditors = [];

    for (const person in balances) {
        const balance = balances[person];
        if (balance < -0.01) {
            debtors.push({ name: person, amount: balance });
        } else if (balance > 0.01) {
            creditors.push({ name: person, amount: balance });
        }
    }

    debtors.sort((a, b) => a.amount - b.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
        const debtor = debtors[debtorIndex];
        const creditor = creditors[creditorIndex];
        const amountToTransfer = Math.min(-debtor.amount, creditor.amount);

        if (amountToTransfer > 0.01) {
            transactions.push({
                from: debtor.name,
                to: creditor.name,
                amount: amountToTransfer
            });

            debtor.amount += amountToTransfer;
            creditor.amount -= amountToTransfer;
        }

        if (Math.abs(debtor.amount) < 0.01) debtorIndex++;
        if (Math.abs(creditor.amount) < 0.01) creditorIndex++;
    }
    return transactions;
}

/**
 * アプリの状態をリセットする関数
 */
function resetApp() {
    if (confirm('すべての入力内容と計算結果をリセットしますか？')) {
        participants = [];
        expenses = [];
        renderParticipantList();
        updatePayerOptions();
        renderExpenseList();
        resultArea.style.display = 'none';
        participantNameInput.value = '';
        amountInput.value = '';
        descriptionInput.value = '';
        payerSelect.value = '';
        participantNameInput.focus();
    }
}

// --- ローカルストレージ対応（セッション保存）---
function saveToLocalStorage() {
    try {
        // キー名を変更して他のアプリと衝突しないようにする
        localStorage.setItem('smartSplitApp_participants', JSON.stringify(participants));
        localStorage.setItem('smartSplitApp_expenses', JSON.stringify(expenses));
    } catch (e) {
        console.error('ローカルストレージへの保存に失敗しました:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const savedParticipants = localStorage.getItem('smartSplitApp_participants');
        const savedExpenses = localStorage.getItem('smartSplitApp_expenses');
        
        if (savedParticipants) participants = JSON.parse(savedParticipants);
        if (savedExpenses) expenses = JSON.parse(savedExpenses);
        
    } catch (e) {
        console.error('ローカルストレージからの読み込みに失敗しました:', e);
    }
}

// データ変更時の自動保存
['addParticipant', 'removeParticipant', 'addExpense', 'removeExpense', 'resetApp'].forEach(funcName => {
    const originalFunc = window[funcName];
    window[funcName] = function() {
        originalFunc.apply(this, arguments);
        saveToLocalStorage();
    };
});

// --- 初期化処理 ---
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    renderParticipantList();
    updatePayerOptions();
    renderExpenseList();
});