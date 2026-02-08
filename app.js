/* --- CONFIGURAÇÃO E DADOS --- */
const STORAGE_KEY = 'meu_financeiro_db';

// Dados iniciais padrão
const DADOS_INICIAIS = {
    transacoes: [],
    categorias: [
        { id: 1, nome: 'Alimentação', tipo: 'Despesa' },
        { id: 2, nome: 'Salário', tipo: 'Receita' },
        { id: 3, nome: 'Lazer', tipo: 'Despesa' },
        { id: 4, nome: 'Transporte', tipo: 'Despesa' }
    ]
};

let DB = { transacoes: [], categorias: [] };

/* --- FUNÇÕES DO BANCO (LOCALSTORAGE) --- */
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
    atualizarTela();
}

function gerarId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

/* --- INICIALIZAÇÃO --- */
document.addEventListener('DOMContentLoaded', () => {
    carregarBanco();
    configurarDatas(); // Bloqueia calendário futuro
    atualizarTela();
    configurarFormularios();
});

// FUNÇÃO QUE TRAVA O CALENDÁRIO
function configurarDatas() {
    const hoje = new Date().toISOString().split('T')[0];

    const dataInput = document.getElementById('data');
    if (dataInput) {
        dataInput.value = hoje;
        dataInput.setAttribute('max', hoje); // Bloqueio Visual
    }

    const editDataInput = document.getElementById('edit-trans-data');
    if (editDataInput) {
        editDataInput.setAttribute('max', hoje); // Bloqueio Visual
    }
}

/* --- RENDERIZAÇÃO --- */
function atualizarTela() {
    atualizarSelectCategorias();
    calcularTotais();
}

function atualizarSelectCategorias() {
    const select = document.getElementById('categoria');
    if (!select) return;

    // Guarda a seleção atual se houver
    const valorAtual = select.value;

    select.innerHTML = '<option value="">Selecione...</option>';

    DB.categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = `${cat.nome} (${cat.tipo})`;
        select.appendChild(option);
    });

    // Tenta restaurar a seleção
    if (valorAtual) select.value = valorAtual;
}

/* --- FUNÇÃO CORRIGIDA PARA CORES NO SALDO --- */

/* --- FUNÇÃO CORRIGIDA: SEM SINAL DE MENOS --- */

/* --- FUNÇÃO: SALDO, BORDAS E TÍTULOS COLORIDOS --- */

function calcularTotais() {
    let totalBRL = 0;
    let totalEUR = 0;

    // 1. Soma os valores
    DB.transacoes.forEach(t => {
        const val = parseFloat(t.valor);
        if (t.moeda === 'BRL') totalBRL += val;
        else totalEUR += val;
    });

    // --- ATUALIZA CARD DE REAIS (BRL) ---
    const cardBRL = document.getElementById('card-brl');
    const valorBRL = document.getElementById('saldo-brl');
    const tituloBRL = cardBRL.querySelector('h3'); // Seleciona o título do card

    // Define o valor sem sinal negativo
    valorBRL.textContent = `R$ ${Math.abs(totalBRL).toFixed(2)}`;

    if (totalBRL < 0) {
        // NEGATIVO (Vermelho)
        const cor = '#FF6B6B';
        valorBRL.style.color = cor;
        cardBRL.style.borderColor = cor;
        tituloBRL.style.color = cor; // Pinta o título
    } else if (totalBRL > 0) {
        // POSITIVO (Verde)
        const cor = '#2ECC71';
        valorBRL.style.color = cor;
        cardBRL.style.borderColor = cor;
        tituloBRL.style.color = cor; // Pinta o título
    } else {
        // ZERO (Cores originais do tema)
        valorBRL.style.color = 'var(--text)';
        cardBRL.style.borderColor = 'var(--border)';
        tituloBRL.style.color = 'var(--text)'; // Volta ao normal
    }

    // --- ATUALIZA CARD DE EUROS (EUR) ---
    const cardEUR = document.getElementById('card-eur');
    const valorEUR = document.getElementById('saldo-eur');
    const tituloEUR = cardEUR.querySelector('h3'); // Seleciona o título do card

    valorEUR.textContent = `€ ${Math.abs(totalEUR).toFixed(2)}`;

    if (totalEUR < 0) {
        const cor = '#FF6B6B';
        valorEUR.style.color = cor;
        cardEUR.style.borderColor = cor;
        tituloEUR.style.color = cor;
    } else if (totalEUR > 0) {
        const cor = '#2ECC71';
        valorEUR.style.color = cor;
        cardEUR.style.borderColor = cor;
        tituloEUR.style.color = cor;
    } else {
        valorEUR.style.color = 'var(--text)';
        cardEUR.style.borderColor = 'var(--border)';
        tituloEUR.style.color = 'var(--text)';
    }
}

/* --- FORMULÁRIOS --- */
function configurarFormularios() {

    // 1. SALVAR CATEGORIA (Corrigido)
    const formCat = document.getElementById('form-categoria');
    if (formCat) {
        formCat.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log("Salvando Categoria..."); // Debug

            const nomeInput = document.getElementById('cat-nome');
            const tipoInput = document.getElementById('cat-tipo');

            if (!nomeInput.value) {
                alert("Digite um nome para a categoria!");
                return;
            }

            const novaCategoria = {
                id: gerarId(),
                nome: nomeInput.value,
                tipo: tipoInput.value
            };

            DB.categorias.push(novaCategoria);
            salvarBanco(); // Salva e atualiza tela

            nomeInput.value = ''; // Limpa campo
            alert("Categoria criada com sucesso!");
        });
    }

    // 2. SALVAR TRANSAÇÃO
    const formTrans = document.getElementById('form-transacao');
    if (formTrans) {
        formTrans.addEventListener('submit', (e) => {
            e.preventDefault();

            // Bloqueio Lógico de Data Futura
            const inputData = document.getElementById('data').value;
            const hoje = new Date().toISOString().split('T')[0];
            if (inputData > hoje) {
                alert("⚠️ Erro: Data futura não permitida!");
                return;
            }

            const selectCat = document.getElementById('categoria');
            if (!selectCat.value) {
                alert("Selecione uma categoria!");
                return;
            }

            const catId = parseInt(selectCat.value);
            const catObj = DB.categorias.find(c => c.id === catId);
            const nomeCategoria = catObj ? catObj.nome : "Desconhecida";
            const ehDespesa = catObj ? catObj.tipo === 'Despesa' : true;

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
                categoria: nomeCategoria
            };

            DB.transacoes.push(novaTransacao);
            salvarBanco();

            formTrans.reset();
            document.getElementById('data').value = hoje;
        });
    }

    // 3. EDITAR TRANSAÇÃO (COM TODOS OS CAMPOS)
    const formEdit = document.getElementById('form-editar-transacao');
    if (formEdit) {
        formEdit.addEventListener('submit', (e) => {
            e.preventDefault();

            const id = parseInt(document.getElementById('edit-trans-id').value);
            const inputData = document.getElementById('edit-trans-data').value;
            const hoje = new Date().toISOString().split('T')[0];

            if (inputData > hoje) {
                alert("⚠️ Data futura não permitida na edição!");
                return;
            }

            const index = DB.transacoes.findIndex(t => t.id === id);

            if (index !== -1) {
                const transacaoAntiga = DB.transacoes[index];

                // Pega os novos valores
                let novoValor = parseFloat(document.getElementById('edit-trans-valor').value);
                const novaCategoriaId = parseInt(document.getElementById('edit-trans-categoria').value);
                const novaMoeda = document.getElementById('edit-trans-moeda').value;

                // Descobre se a nova categoria é Despesa ou Receita
                const catObj = DB.categorias.find(c => c.id === novaCategoriaId);
                const ehDespesa = catObj ? catObj.tipo === 'Despesa' : true;
                const nomeCategoria = catObj ? catObj.nome : "Desconhecida";

                // Ajusta o sinal do valor (Negativo se for Despesa)
                if (ehDespesa) novoValor = -Math.abs(novoValor);
                else novoValor = Math.abs(novoValor);

                // Atualiza o objeto no banco
                DB.transacoes[index] = {
                    ...transacaoAntiga,
                    data: inputData,
                    descricao: document.getElementById('edit-trans-descricao').value,
                    valor: novoValor,
                    moeda: novaMoeda,
                    categoria_id: novaCategoriaId,
                    categoria: nomeCategoria
                };

                salvarBanco();
                fecharModal('modal-editar-transacao');
                atualizarListagemAberta();
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

                salvarBanco(); // Atualiza tudo (incluindo o select do formulário)
                fecharModal('modal-editar-categoria');
                abrirModalListaCategorias();
            }
        });
    }
}

/* --- FUNÇÕES AUXILIARES --- */
function atualizarListagemAberta() {
    const modal = document.getElementById('modal-transacoes-moeda');
    if (modal.style.display === 'flex') {
        const titulo = document.getElementById('titulo-modal-moeda').innerText;
        if (titulo.includes('Extrato')) abrirExtratoCompleto();
        else if (titulo.includes('BRL')) abrirModalTransacoesMoeda('BRL');
        else if (titulo.includes('EUR')) abrirModalTransacoesMoeda('EUR');
    }
}

function abrirExtratoCompleto() {
    const modal = document.getElementById('modal-transacoes-moeda');
    const titulo = document.getElementById('titulo-modal-moeda');
    const corpo = document.getElementById('corpo-tabela-moeda');

    titulo.innerHTML = '<i class="fas fa-history"></i> Extrato Completo';
    corpo.innerHTML = '';

    const todas = DB.transacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
    if (todas.length === 0) corpo.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Vazio.</td></tr>';
    else todas.forEach(t => renderizarLinhaTransacao(t, corpo));

    modal.style.display = 'flex';
}

function abrirModalTransacoesMoeda(moeda) {
    const modal = document.getElementById('modal-transacoes-moeda');
    const titulo = document.getElementById('titulo-modal-moeda');
    const corpo = document.getElementById('corpo-tabela-moeda');

    titulo.innerText = `Despesas em ${moeda}`;
    corpo.innerHTML = '';

    const filtradas = DB.transacoes.filter(t => t.moeda === moeda && t.valor < 0)
        .sort((a, b) => new Date(b.data) - new Date(a.data));

    if (filtradas.length === 0) corpo.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Nenhuma despesa.</td></tr>';
    else filtradas.forEach(t => renderizarLinhaTransacao(t, corpo));

    modal.style.display = 'flex';
}

function renderizarLinhaTransacao(t, tbody) {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--border)';

    const val = parseFloat(t.valor);
    const ehDespesa = val < 0;

    // Busca categoria atualizada (caso tenha mudado de nome)
    const catObj = DB.categorias.find(c => c.id === t.categoria_id);
    const nomeCat = catObj ? catObj.nome : t.categoria;
    const tipoCat = catObj ? catObj.tipo : (ehDespesa ? 'Despesa' : 'Receita');
    const badgeClass = tipoCat === 'Receita' ? 'badge-receita' : 'badge-despesa';
    const corValor = ehDespesa ? '#FF6B6B' : '#2ECC71';

    tr.innerHTML = `
        <td style="padding: 10px;">${new Date(t.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
        <td>${t.descricao}</td>
        <td><span class="badge ${badgeClass}">${nomeCat}</span></td>
        <td style="color: ${corValor}; font-weight: bold;">
            ${t.moeda === 'BRL' ? 'R$' : '€'} ${Math.abs(val).toFixed(2)}
        </td>
        <td style="text-align: right;">
            <button class="btn-action edit" onclick="prepararEdicaoTransacao(${t.id})"><i class="fas fa-edit"></i></button>
            <button class="btn-action delete" onclick="excluirTransacao(${t.id})"><i class="fas fa-trash"></i></button>
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
                <button class="btn-action edit" onclick="prepararEdicaoCategoria(${c.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-action delete" onclick="excluirCategoria(${c.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    modal.style.display = 'flex';
}

function excluirTransacao(id) {
    if (!confirm("Tem certeza?")) return;
    DB.transacoes = DB.transacoes.filter(t => t.id !== id);
    salvarBanco();
    atualizarListagemAberta();
}

function excluirCategoria(id) {
    if (DB.transacoes.some(t => t.categoria_id === id)) {
        alert("Erro: Categoria em uso por transações!");
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

    // 1. Preenche os campos básicos
    document.getElementById('edit-trans-id').value = t.id;
    document.getElementById('edit-trans-data').value = t.data;
    document.getElementById('edit-trans-valor').value = Math.abs(t.valor);
    document.getElementById('edit-trans-descricao').value = t.descricao;
    document.getElementById('edit-trans-moeda').value = t.moeda; // Preenche a moeda

    // 2. Preenche o Select de Categorias dentro do Modal de Edição
    const selectCat = document.getElementById('edit-trans-categoria');
    selectCat.innerHTML = '<option value="">Selecione...</option>';

    DB.categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = `${cat.nome} (${cat.tipo})`;
        selectCat.appendChild(option);
    });

    // 3. Seleciona a categoria atual da transação
    selectCat.value = t.categoria_id;

    // 4. Abre o modal
    document.getElementById('modal-editar-transacao').style.display = 'flex';
}

function prepararEdicaoCategoria(id) {
    const c = DB.categorias.find(x => x.id === id);
    if (!c) return;
    document.getElementById('edit-cat-id').value = c.id;
    document.getElementById('edit-cat-nome').value = c.nome;
    document.getElementById('edit-cat-tipo').value = c.tipo;
    document.getElementById('modal-editar-categoria').style.display = 'flex';
}

function fecharModal(id) {
    document.getElementById(id).style.display = 'none';
}