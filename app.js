/* --- CONFIGURAÇÃO E DADOS --- */
const STORAGE_KEY = 'meu_financeiro_db';

// Estrutura inicial dos dados (caso seja o primeiro acesso)
const DADOS_INICIAIS = {
    transacoes: [],
    categorias: [
        { id: 1, nome: 'Alimentação', tipo: 'Despesa' },
        { id: 2, nome: 'Salário', tipo: 'Receita' },
        { id: 3, nome: 'Lazer', tipo: 'Despesa' },
        { id: 4, nome: 'Transporte', tipo: 'Despesa' }
    ]
};

// Variável global que segura os dados na memória
let DB = { transacoes: [], categorias: [] };

/* --- FUNÇÕES DO "BANCO DE DADOS" (LOCALSTORAGE) --- */

function carregarBanco() {
    const dadosSalvos = localStorage.getItem(STORAGE_KEY);
    if (dadosSalvos) {
        DB = JSON.parse(dadosSalvos);
    } else {
        DB = DADOS_INICIAIS;
        salvarBanco();
    }
}

function salvarBanco() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
    atualizarTela(); // Sempre que salvar, atualiza a tela
}

// Gera um ID único baseado no relógio (timestamp)
function gerarId() {
    return Date.now();
}

/* --- INICIALIZAÇÃO --- */

document.addEventListener('DOMContentLoaded', () => {
    carregarBanco();
    configurarDatas();
    atualizarTela();
    configurarFormularios();
});

function configurarDatas() {
    const hoje = new Date().toISOString().split('T')[0];

    const dataInput = document.getElementById('data');
    if (dataInput) {
        dataInput.value = hoje;
        dataInput.max = hoje;
    }

    const editDataInput = document.getElementById('edit-trans-data');
    if (editDataInput) {
        editDataInput.max = hoje;
    }
}

/* --- ATUALIZAÇÃO DA TELA (RENDERIZAÇÃO) --- */

function atualizarTela() {
    atualizarSelectCategorias();
    calcularTotais();
}

function atualizarSelectCategorias() {
    const select = document.getElementById('categoria');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione...</option>';

    DB.categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = `${cat.nome} (${cat.tipo})`;
        select.appendChild(option);
    });
}

function calcularTotais() {
    let totalBRL = 0;
    let totalEUR = 0;

    DB.transacoes.forEach(t => {
        const val = parseFloat(t.valor);
        if (t.moeda === 'BRL') totalBRL += val;
        else totalEUR += val;
    });

    // Atualiza os cards
    document.getElementById('saldo-brl').textContent = `R$ ${totalBRL.toFixed(2)}`;
    document.getElementById('saldo-eur').textContent = `€ ${totalEUR.toFixed(2)}`;

    // Muda a cor se estiver negativo
    document.getElementById('card-brl').style.borderColor = totalBRL < 0 ? '#E55039' : 'var(--border)';
    document.getElementById('card-eur').style.borderColor = totalEUR < 0 ? '#E55039' : 'var(--border)';
}

/* --- FORMULÁRIOS (ADICIONAR) --- */

function configurarFormularios() {
    // 1. SALVAR TRANSAÇÃO
    const formTrans = document.getElementById('form-transacao');
    if (formTrans) {
        formTrans.addEventListener('submit', (e) => {
            e.preventDefault();

            // Validação de Data Futura
            const inputData = document.getElementById('data').value;
            const hoje = new Date().toISOString().split('T')[0];
            if (inputData > hoje) {
                alert("⚠️ Não é permitido adicionar transações com data futura!");
                return;
            }

            const selectCat = document.getElementById('categoria');
            if (!selectCat.value) {
                alert("Selecione uma categoria!");
                return;
            }

            // Descobre o nome da categoria pelo ID selecionado
            const catId = parseInt(selectCat.value);
            const catObj = DB.categorias.find(c => c.id === catId);
            const nomeCategoria = catObj ? catObj.nome : "Desconhecida";
            const ehDespesa = catObj ? catObj.tipo === 'Despesa' : true;

            // Tratamento do valor (Negativo se for Despesa)
            let valorInput = parseFloat(document.getElementById('valor').value);
            if (ehDespesa) valorInput = -Math.abs(valorInput);
            else valorInput = Math.abs(valorInput);

            const novaTransacao = {
                id: gerarId(),
                data: inputData,
                descricao: document.getElementById('descricao').value,
                valor: valorInput,
                moeda: document.getElementById('moeda').value,
                categoria_id: catId,
                categoria: nomeCategoria // Salvamos o nome junto para facilitar
            };

            DB.transacoes.push(novaTransacao);
            salvarBanco();

            formTrans.reset();
            document.getElementById('data').value = hoje;
            alert("Transação salva com sucesso!");
        });
    }

    // 2. SALVAR CATEGORIA
    const formCat = document.getElementById('form-categoria');
    if (formCat) {
        formCat.addEventListener('submit', (e) => {
            e.preventDefault();

            const nome = document.getElementById('cat-nome').value;
            const tipo = document.getElementById('cat-tipo').value;

            const novaCategoria = {
                id: gerarId(),
                nome: nome,
                tipo: tipo
            };

            DB.categorias.push(novaCategoria);
            salvarBanco();

            document.getElementById('cat-nome').value = '';
            alert("Categoria criada!");
        });
    }

    // 3. EDITAR TRANSAÇÃO
    const formEdit = document.getElementById('form-editar-transacao');
    if (formEdit) {
        formEdit.addEventListener('submit', (e) => {
            e.preventDefault();

            const id = parseInt(document.getElementById('edit-trans-id').value);
            const inputData = document.getElementById('edit-trans-data').value;
            const hoje = new Date().toISOString().split('T')[0];

            if (inputData > hoje) {
                alert("⚠️ Data não pode ser futura!");
                return;
            }

            // Encontra e atualiza
            const index = DB.transacoes.findIndex(t => t.id === id);
            if (index !== -1) {
                const transacaoAntiga = DB.transacoes[index];
                let novoValor = parseFloat(document.getElementById('edit-trans-valor').value);

                // Mantém o sinal original (se era negativo, continua negativo)
                if (transacaoAntiga.valor < 0) novoValor = -Math.abs(novoValor);
                else novoValor = Math.abs(novoValor);

                DB.transacoes[index] = {
                    ...transacaoAntiga,
                    data: inputData,
                    descricao: document.getElementById('edit-trans-descricao').value,
                    valor: novoValor
                };

                salvarBanco();
                fecharModal('modal-editar-transacao');

                // Atualiza a lista que estava aberta
                if (document.getElementById('modal-transacoes-moeda').style.display === 'flex') {
                    const titulo = document.getElementById('titulo-modal-moeda').innerText;
                    if (titulo.includes('Extrato')) abrirExtratoCompleto();
                    else if (titulo.includes('BRL')) abrirModalTransacoesMoeda('BRL');
                    else if (titulo.includes('EUR')) abrirModalTransacoesMoeda('EUR');
                }
            }
        });
    }

    // 4. EDITAR CATEGORIA
    const formEditCat = document.getElementById('form-editar-categoria');
    if (formEditCat) {
        formEditCat.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = parseInt(document.getElementById('edit-cat-id').value);

            const index = DB.categorias.findIndex(c => c.id === id);
            if (index !== -1) {
                DB.categorias[index].nome = document.getElementById('edit-cat-nome').value;
                DB.categorias[index].tipo = document.getElementById('edit-cat-tipo').value;

                salvarBanco();
                fecharModal('modal-editar-categoria');
                abrirModalListaCategorias(); // Recarrega a lista
            }
        });
    }
}

/* --- MODAIS E LISTAGENS --- */

function abrirExtratoCompleto() {
    const modal = document.getElementById('modal-transacoes-moeda');
    const titulo = document.getElementById('titulo-modal-moeda');
    const corpo = document.getElementById('corpo-tabela-moeda');

    titulo.innerHTML = '<i class="fas fa-history"></i> Extrato Completo';
    corpo.innerHTML = '';

    const todas = DB.transacoes.sort((a, b) => new Date(b.data) - new Date(a.data));

    if (todas.length === 0) {
        corpo.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Nenhum registro encontrado.</td></tr>';
    } else {
        todas.forEach(t => renderizarLinhaTransacao(t, corpo));
    }
    modal.style.display = 'flex';
}

function abrirModalTransacoesMoeda(moeda) {
    const modal = document.getElementById('modal-transacoes-moeda');
    const titulo = document.getElementById('titulo-modal-moeda');
    const corpo = document.getElementById('corpo-tabela-moeda');

    titulo.innerText = `Despesas em ${moeda}`;
    corpo.innerHTML = '';

    const filtradas = DB.transacoes
        .filter(t => t.moeda === moeda && t.valor < 0)
        .sort((a, b) => new Date(b.data) - new Date(a.data));

    if (filtradas.length === 0) {
        corpo.innerHTML = '<tr><td colspan="5" style="padding:20px; text-align:center;">Nenhuma despesa encontrada.</td></tr>';
    } else {
        filtradas.forEach(t => renderizarLinhaTransacao(t, corpo));
    }
    modal.style.display = 'flex';
}

function renderizarLinhaTransacao(t, tbody) {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--border)';

    const val = parseFloat(t.valor);
    const ehDespesa = val < 0;
    const corValor = ehDespesa ? '#FF6B6B' : '#2ECC71';

    // Tenta achar o tipo da categoria para pintar o badge
    const catObj = DB.categorias.find(c => c.id === t.categoria_id);
    const tipoCat = catObj ? catObj.tipo : (ehDespesa ? 'Despesa' : 'Receita');
    const badgeClass = tipoCat === 'Receita' ? 'badge-receita' : 'badge-despesa';
    const nomeCat = catObj ? catObj.nome : t.categoria;

    tr.innerHTML = `
        <td style="padding: 10px;">${new Date(t.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
        <td>${t.descricao}</td>
        <td><span class="badge ${badgeClass}">${nomeCat}</span></td>
        <td style="color: ${corValor}; font-weight: bold;">
            ${t.moeda === 'BRL' ? 'R$' : '€'} ${Math.abs(val).toFixed(2)}
        </td>
        <td style="text-align: right;">
            <button class="btn-action edit" onclick="prepararEdicaoTransacao(${t.id})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-action delete" onclick="excluirTransacao(${t.id})">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    tbody.appendChild(tr);
}

function abrirModalListaCategorias() {
    const modal = document.getElementById('modal-lista-categorias');
    const tbody = document.getElementById('tabela-categorias-body');

    tbody.innerHTML = '';

    DB.categorias.forEach(c => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border)';
        const badgeClass = c.tipo === 'Receita' ? 'badge-receita' : 'badge-despesa';

        tr.innerHTML = `
            <td style="padding: 10px;">${c.nome}</td>
            <td><span class="badge ${badgeClass}">${c.tipo}</span></td>
            <td style="text-align: right;">
                <button class="btn-action edit" onclick="prepararEdicaoCategoria(${c.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" onclick="excluirCategoria(${c.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    modal.style.display = 'flex';
}

/* --- FUNÇÕES DE AÇÃO (EXCLUIR / EDITAR) --- */

function excluirTransacao(id) {
    if (!confirm("Tem certeza que deseja apagar?")) return;

    DB.transacoes = DB.transacoes.filter(t => t.id !== id);
    salvarBanco();

    // Atualiza a lista aberta
    const titulo = document.getElementById('titulo-modal-moeda').innerText;
    if (titulo.includes('Extrato')) abrirExtratoCompleto();
    else if (titulo.includes('BRL')) abrirModalTransacoesMoeda('BRL');
    else if (titulo.includes('EUR')) abrirModalTransacoesMoeda('EUR');
}

function excluirCategoria(id) {
    // Verifica se está em uso
    const emUso = DB.transacoes.some(t => t.categoria_id === id);
    if (emUso) {
        alert("Não é possível excluir: Existem transações usando esta categoria!");
        return;
    }

    if (!confirm("Excluir categoria?")) return;

    DB.categorias = DB.categorias.filter(c => c.id !== id);
    salvarBanco();
    abrirModalListaCategorias();
}

function prepararEdicaoTransacao(id) {
    const t = DB.transacoes.find(x => x.id === id);
    if (!t) return;

    document.getElementById('edit-trans-id').value = t.id;
    document.getElementById('edit-trans-data').value = t.data;
    document.getElementById('edit-trans-valor').value = Math.abs(t.valor);
    document.getElementById('edit-trans-descricao').value = t.descricao;

    // Abre o modal de edição (certifique-se de ter esse modal no HTML)
    // Se não tiver, me avise que criamos!
    const modalEdit = document.getElementById('modal-editar-transacao');
    if (modalEdit) modalEdit.style.display = 'flex';
}

function prepararEdicaoCategoria(id) {
    const c = DB.categorias.find(x => x.id === id);
    if (!c) return;

    document.getElementById('edit-cat-id').value = c.id;
    document.getElementById('edit-cat-nome').value = c.nome;
    document.getElementById('edit-cat-tipo').value = c.tipo;

    const modalEdit = document.getElementById('modal-editar-categoria');
    if (modalEdit) modalEdit.style.display = 'flex';
}

/* --- FUNÇÕES GENÉRICAS DE MODAL --- */
function fecharModal(id) {
    document.getElementById(id).style.display = 'none';
}
function fecharEEditar(tStr) {
    // Função legada adaptada (caso o HTML ainda chame essa)
    // O ideal é usar prepararEdicaoTransacao(id)
}