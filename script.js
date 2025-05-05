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
const isTouchDevice = () => {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
};

// タッチデバイス向けの初期化
if (isTouchDevice()) {
    document.body.classList.add('touch-device');
}

// --- 関数定義 ---

/**
 * 参加者を追加する関数
 */
function addParticipant() {
    const name = participantNameInput.value.trim(); // .trim()で前後の空白削除
    if (name && !participants.includes(name)) { // 名前があり、かつ重複していない場合
        participants.push(name);
        renderParticipantList();
        updatePayerOptions();
        participantNameInput.value = ''; // 入力欄をクリア
    } else if (!name) {
        alert('参加者の名前を入力してください。');
    } else {
        alert('同じ名前の参加者が既に存在します。');
    }
    participantNameInput.focus(); // 入力欄にフォーカスを戻す
}

/**
 * 参加者リストをHTMLに描画する関数
 */
function renderParticipantList() {
    participantListElement.innerHTML = '<li>参加者リスト:</li>'; // ヘッダーを再設定
    participants.forEach((name, index) => {
        const li = document.createElement('li');
        // 名前を表示するための要素
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        li.appendChild(nameSpan);
        
        // 削除ボタンを追加
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

    // 確認ダイアログを表示（モバイルでも操作ミスを防止）
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
    const originalValue = payerSelect.value; // 現在選択されている値を保持
    payerSelect.innerHTML = '<option value="">--選択してください--</option>'; // デフォルトオプション
    participants.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        payerSelect.appendChild(option);
    });
    // 可能であれば元の選択肢を復元
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
    if (!payer) {
        alert('支払った人を選択してください。');
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        alert('有効な金額を入力してください。');
        return;
    }
    if (!description) {
        alert('内容を入力してください。');
        return;
    }

    // 支払い情報をexpenses配列に追加
    expenses.push({ payer, amount, description });
    renderExpenseList();

    // 入力欄をクリア
    // payerSelect.value = ''; // 支払者はクリアしない方が連続入力しやすい
    amountInput.value = '';
    descriptionInput.value = '';
    amountInput.focus(); // 金額欄にフォーカス
    
    // スマホでは自動スクロールして入力欄を見やすく
    if (isTouchDevice()) {
        amountInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * 支払いリストをHTMLに描画する関数
 */
function renderExpenseList() {
    expenseListElement.innerHTML = ''; // リストをクリア
    expenses.forEach((expense, index) => {
        const li = document.createElement('li');
        
        // コンテンツを含むコンテナ要素
        const contentDiv = document.createElement('div');
        contentDiv.className = 'expense-content';
        contentDiv.textContent = `${expense.description}: ${expense.amount}円 (支払者: ${expense.payer})`;
        li.appendChild(contentDiv);
        
        // 削除ボタンを追加
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
    
    // 確認ダイアログを表示（モバイルでも操作ミスを防止）
    if (confirm(`${expense.description}（${expense.amount}円）を削除しますか？`)) {
        expenses.splice(indexToRemove, 1);
        renderExpenseList();
        resultArea.style.display = 'none'; // 結果表示を隠す
    }
}

/**
 * 削除ボタンを作成する共通関数
 */
function createDeleteButton(onClickAction) {
    const button = document.createElement('button');
    button.textContent = '×'; // バツ印
    button.className = 'delete-btn';
    button.title = '削除';
    button.addEventListener('click', function(event) {
        event.stopPropagation(); // イベントの伝播を止める
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

    // --- 1. 各個人の収支を計算 ---
    const balances = {}; // 各参加者の収支 (プラス: 受取額, マイナス: 支払額)
    participants.forEach(p => balances[p] = 0); // 全員0で初期化

    let totalAmount = 0;
    expenses.forEach(expense => {
        balances[expense.payer] += expense.amount; // 支払った分を加算
        totalAmount += expense.amount;
    });

    const amountPerPerson = totalAmount / participants.length; // 一人あたりの負担額

    participants.forEach(p => {
        balances[p] -= amountPerPerson; // 負担額を差し引く
    });

    // --- 2. 収支リストを表示 ---
    balanceListElement.innerHTML = ''; // クリア
    participants.forEach(p => {
        const li = document.createElement('li');
        const balance = balances[p];
        const balanceText = balance >= 0
            ? `+${Math.round(balance)} 円 (受け取り)`
            : `${Math.round(balance)} 円 (支払い)`;
        li.textContent = `${p}: ${balanceText}`;
        // プラスかマイナスかでクラスを付与して色分け
        li.classList.add(balance >= 0 ? 'positive' : 'negative');
        balanceListElement.appendChild(li);
    });

    // --- 概要を表示 ---
    summaryTextElement.textContent = `合計金額: ${Math.round(totalAmount)}円 / 一人あたり: ${Math.round(amountPerPerson)}円`;

    // --- 3. 支払い（精算）を計算 (Debt Simplification Algorithm) ---
    const transactions = calculateTransactions(balances);

    // --- 4. 精算リストを表示 ---
    transactionListElement.innerHTML = ''; // クリア
    if (transactions.length === 0) {
        const li = document.createElement('li');
        li.textContent = '精算の必要はありません。';
        transactionListElement.appendChild(li);
    } else {
        transactions.forEach(t => {
            const li = document.createElement('li');
            // 小数点以下を丸める（例：日本の場合は整数に丸めることが多い）
            const roundedAmount = Math.round(t.amount);
            // 丸めた結果0円になった取引は表示しない
            if (roundedAmount > 0) {
                li.textContent = `${t.from} が ${t.to} に ${roundedAmount} 円支払う`;
                transactionListElement.appendChild(li);
            }
        });
        // 丸めた結果、取引が何も表示されなかった場合のメッセージ
        if (transactionListElement.children.length === 0) {
            const li = document.createElement('li');
            li.textContent = '精算の必要はありません（端数は無視されました）。';
            transactionListElement.appendChild(li);
        }
    }

    // --- 結果エリア全体を表示 ---
    resultArea.style.display = 'block';
    
    // 計算結果にスクロール
    setTimeout(() => {
        resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

/**
 * 精算取引を計算するアルゴリズム (誰が誰にいくら払うか)
 * @param {object} balances - 各参加者の収支 (例: {'鈴木': -1000, '佐藤': 3000, '高橋': -2000})
 * @returns {array} 取引リスト (例: [{ from: '高橋', to: '佐藤', amount: 2000 }])
 */
function calculateTransactions(balances) {
    const transactions = [];
    const debtors = []; // 支払う必要がある人
    const creditors = []; // 受け取る権利がある人

    // 参加者を貸し手と借り手に分類
    for (const person in balances) {
        const balance = balances[person];
        // 非常に小さい誤差は無視する（例: 0.01円未満）
        if (balance < -0.01) {
            debtors.push({ name: person, amount: balance });
        } else if (balance > 0.01) {
            creditors.push({ name: person, amount: balance });
        }
    }

    // 金額が大きい順にソート（絶対値で）
    debtors.sort((a, b) => a.amount - b.amount); // 負の数が大きい順 (例: -2000, -1000)
    creditors.sort((a, b) => b.amount - a.amount); // 正の数が大きい順 (例: 3000)

    let debtorIndex = 0;
    let creditorIndex = 0;

    // どちらかのリストが空になるまで、またはインデックスがリストの最後に達するまでループ
    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
        const debtor = debtors[debtorIndex];
        const creditor = creditors[creditorIndex];
        const amountToTransfer = Math.min(-debtor.amount, creditor.amount); // 支払う額と受け取る額の小さい方

        if (amountToTransfer > 0.01) { // 誤差以上の取引のみ記録
            transactions.push({
                from: debtor.name,
                to: creditor.name,
                amount: amountToTransfer
            });

            // 残高を更新
            debtor.amount += amountToTransfer;
            creditor.amount -= amountToTransfer;
        }

        // 残高がほぼゼロになったら次の人に移る
        if (Math.abs(debtor.amount) < 0.01) {
            debtorIndex++;
        }
        if (Math.abs(creditor.amount) < 0.01) {
            creditorIndex++;
        }
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
        resultArea.style.display = 'none'; // 結果表示を隠す
        participantNameInput.value = '';
        amountInput.value = '';
        descriptionInput.value = '';
        payerSelect.value = '';
        participantNameInput.focus(); // 最初の入力欄にフォーカス
    }
}

// --- ローカルストレージ対応（セッション保存）---
// ページを離れても状態を保持

/**
 * アプリの状態をローカルストレージに保存
 */
function saveToLocalStorage() {
    try {
        localStorage.setItem('participants', JSON.stringify(participants));
        localStorage.setItem('expenses', JSON.stringify(expenses));
    } catch (e) {
        console.error('ローカルストレージへの保存に失敗しました:', e);
    }
}

/**
 * ローカルストレージから状態を復元
 */
function loadFromLocalStorage() {
    try {
        const savedParticipants = localStorage.getItem('participants');
        const savedExpenses = localStorage.getItem('expenses');
        
        if (savedParticipants) {
            participants = JSON.parse(savedParticipants);
        }
        
        if (savedExpenses) {
            expenses = JSON.parse(savedExpenses);
        }
        
        // UIを更新
        renderParticipantList();
        updatePayerOptions();
        renderExpenseList();
    } catch (e) {
        console.error('ローカルストレージからの読み込みに失敗しました:', e);
    }
}

// データ変更時の保存処理
['addParticipant', 'removeParticipant', 'addExpense', 'removeExpense'].forEach(funcName => {
    const originalFunc = window[funcName];
    window[funcName] = function() {
        const result = originalFunc.apply(this, arguments);
        saveToLocalStorage();
        return result;
    };
});

// --- 初期化処理 ---
// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', function() {
    // 保存済みデータがあれば復元
    loadFromLocalStorage();
    
    // 初期表示の更新
    renderParticipantList();
    updatePayerOptions();
    renderExpenseList();
});