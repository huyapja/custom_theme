$(async function() {
    addMenuToLayout();
    addMenuToHeader();
    const currentModule = await getFirstWorkspace();
    await initMenuItem(currentModule);
    await setupModuleMenu(currentModule);
    setupClickShowHideSubMenu();
});

function updateCustomMenu(moduleName='', moduleData) {
    $('#custom-sidebar #menu-title').text(moduleName);
    if (moduleData.cards?.items && moduleData.shortcuts?.items) {
        renderWorkspaceUI(moduleData);
    }
}

function renderWorkspaceUI(data) {
    const $container = $('#custom-sidebar #menu-content');
    $container.empty();

    // Tabs HTML
    const tabsHTML = `
        <ul class="nav nav-tabs" id="workspaceTab" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="menu-tab" data-bs-toggle="tab" data-bs-target="#menu" type="button" role="tab">Menu</button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="shortcuts-tab" data-bs-toggle="tab" data-bs-target="#shortcuts" type="button" role="tab">Shortcuts</button>
            </li>
        </ul>
        <div class="tab-content mt-3" id="workspaceTabContent">
            <div class="tab-pane fade show active" id="menu" role="tabpanel"></div>
            <div class="tab-pane fade" id="shortcuts" role="tabpanel"></div>
        </div>
    `;

    $container.append(tabsHTML);

    $('#custom-sidebar #page-menu .nav-link').on('click', function() {
        $('#custom-sidebar #page-menu #workspaceTab .nav-link.active').removeClass('active');
        $('#custom-sidebar #page-menu #workspaceTabContent .tab-pane').removeClass('show active');
        $(this).addClass('active');
        const contentId = $(this).attr('data-bs-target');
        $(contentId).addClass('show active');
    })

    // Render Menu with Accordions
    const $menuPane = $('#menu');
    const accordionId = 'menuAccordion';
    const $accordion = $(`<div class="accordion" id="${accordionId}"></div>`);

    data.cards?.items?.forEach((card, index) => {
        const collapseId = `collapse-${index}`;
        const headingId = `heading-${index}`;
        const cardLabel = card.label || `Section ${index + 1}`;
        const $cardLinks = $('<div></div>');

        if (card.links && Array.isArray(card.links)) {
            card.links.forEach(link => {
                const linkLabel = link.label || link.link_to || link.name;
                $cardLinks.append(`
                    <div class="mb-2">
                        <a href="/app/${link.link_to?.toLowerCase().replaceAll(' ','-')}" class="fw-semibold text-decoration-none">- ${linkLabel}</a>
                    </div>
                `);
            });
        }

        const accordionItem = `
            <div class="accordion-item">
                <h2 class="accordion-header" id="${headingId}">
                    <button class="accordion-button ${index > 0 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="${index === 0}" aria-controls="${collapseId}">
                        ${cardLabel}
                    </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" aria-labelledby="${headingId}" data-bs-parent="#${accordionId}">
                    <div class="accordion-body">
                        ${$cardLinks.html()}
                    </div>
                </div>
            </div>
        `;

        $accordion.append(accordionItem);
    });

    // Render Shortcuts
    const $shortcutsPane = $('#shortcuts');
    data.shortcuts?.items?.forEach(item => {
        const label = item.label || item.link_to || item.name;
        const type = item.type || '';
        $shortcutsPane.append(`
            <div class="mb-2">
                <button data-link-to="${item.link_to?.toLowerCase().replaceAll(' ','-')}" class="custom-btn custom-btn-outline-primary">${label}</button>
            </div>
        `);
    });

    $menuPane.append($accordion);

    $(`#workspaceTabContent #${accordionId} .accordion-button`).on('click', function () {
        const $button = $(this);
        const $collapse = $($button.data('bs-target'));

        if ($collapse.hasClass('show')) {
          $button.addClass('collapsed');
          $collapse.removeClass('show');
        } else {
          $(`#${accordionId} .accordion-button`).addClass('collapsed');
          $(`#${accordionId} .accordion-collapse`).removeClass('show');

          $button.removeClass('collapsed');
          $collapse.addClass('show');
        }
    });

    $('#workspaceTabContent .custom-btn.custom-btn-outline-primary').on('click', function() {
        const linkTo = $(this).attr('data-link-to');
        if (linkTo) {
            frappe.router.set_route(`/app/${linkTo}`);
        }
    })

}

function getModuleContent(module) {
    return new Promise(res => {
        frappe.call({
            method: "frappe.desk.desktop.get_desktop_page",
            args: {
                page: {
                    name: module
                }
            },
            callback: function(r) {
                res(r.message)
            }
        });
    });
}

function getMainMenuContent() {
    return new Promise(res => {
        frappe.call({
            method: "frappe.desk.desktop.get_workspace_sidebar_items",
            callback: function(r) {
                res(r.message)
            }
        });
    });
}

function addMenuToLayout() {
    $("#body").css("margin-left", "340px");
    const layout = $(`
        <div id="custom-sidebar">
            <div id="main-menu"></div>
            <div id="page-menu">
                <h4 id="menu-title"></h4>
                <div id="menu-content"></div>
            </div>
        </div>
    `);
    $("body").append(layout);
}

function addMenuToHeader() {
    $("header.navbar .container").removeClass("container").addClass("custom-navbar");
    $("header.navbar").prepend(`
        <div id="header-menu">
            <input id="is-show-header-menu" type="checkbox" />
            <div class="menu-icon">
                <label for="is-show-header-menu">
                    <i class="fa-solid fa-bars open-menu-button"></i>
                    <i class="fa-solid fa-xmark close-menu-button"></i>
                </label>
            </div>
            <div class="menu-content-wrapper">
                <div class="row menu-content">
            </div>
            </div>
        </div>
    `);
}

async function initMenuItem(currentModule) {
    const mainMenuData = await getMainMenuContent();
    for (const item of mainMenuData.pages) {
        const isActive = item.module === currentModule;
        $("#custom-sidebar #main-menu").append(`
            <div role="button" class="${'main-menu-item ' + (isActive ? 'active' : '')}" data-link-to="${item.name.toLowerCase().replaceAll(' ', '-')}">
                <svg class="icon icon-md" aria-hidden="true">
                    <use class="" href="#icon-${item.icon}"></use>
                </svg>
                <span>${item.label}</span>
            </div>
        `);
        $('#header-menu .menu-content').append(`
            <div class="col-6 menu-content-item" role="button" data-link-to="${item.name.toLowerCase().replaceAll(' ', '-')}">
                <svg class="icon  icon-md" aria-hidden="true">
                    <use class="" href="#icon-${item.icon}"></use>
                </svg>
                <span>${item.label}</span>
            </div>
        `)
    };
    setTimeout(() => {
        if ($("#main-menu .main-menu-item.active.active").get(0)) {
            $("#main-menu .main-menu-item.active.active").get(0).scrollIntoView({ behavior: 'smooth' });
        }
    }, 750)
    $("#main-menu .main-menu-item").on('click', function() {
        $("#main-menu .main-menu-item.active").removeClass("active");
        $(this).addClass("active");
        const targetLink = $(this).attr("data-link-to");
        frappe.router.set_route(`/app/${targetLink}`);
    })
    $("#header-menu .menu-content-item").on('click', function() {
        const targetLink = $(this).attr("data-link-to");
        frappe.router.set_route(`/app/${targetLink}`);
        $("#is-show-header-menu").prop('checked', false);
    })
}

async function setupModuleMenu(currentModule) {
    if (currentModule) {
        const moduleMenuData = await getModuleContent(currentModule);
        updateCustomMenu(currentModule, moduleMenuData);
        setupToggleSideBarFilter();
    }
    frappe.router.on("change", async () => {
        const route = frappe.get_route();
        if (route?.length === 2) {
            currentModule = route[1];
            const moduleMenuData = await getModuleContent(currentModule);
            updateCustomMenu(currentModule, moduleMenuData);
        };
        setupClickShowHideSubMenu();
        setupToggleSideBarFilter();
    });
}

function setupClickShowHideSubMenu() {
    $('.btn-reset.sidebar-toggle-btn').off('click');
    $('.btn-reset.sidebar-toggle-btn').on('click', function() {
        if ($("#page-menu").is(":visible")) {
            $("#page-menu").hide();
            $("#body").animate({
                marginLeft: "80px"
            }, 200, "linear")
        } else {
            $("#body").animate({
                marginLeft: "340px"
            }, 200, "linear", function() {
                $("#page-menu").show();
            })
        }
    });
}

function setupToggleSideBarFilter() {
    try {
        const parentSelector = $('.content.page-container:not(#page-Workspaces) .col.layout-main-section-wrapper:visible');
        const mainLayout = parentSelector.closest('.row.layout-main');
        const sideSection = mainLayout.find(".col-lg-2.layout-side-section");

        if (parentSelector && mainLayout && sideSection) {
            const toggleBtn = parentSelector.find('.btn-toggle-sidebar');
            if (toggleBtn.length === 0) {
                const newToggleBtn = $(`
                    <button class="btn btn-toggle-sidebar">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                `);
                parentSelector.prepend(newToggleBtn);
                if (mainLayout) {
                    newToggleBtn.on('click', function() {
                        if (sideSection.is(":visible")) {
                            sideSection.hide();
                            newToggleBtn.empty().append('<i class="fa-solid fa-chevron-right"></i>');
                        } else {
                            sideSection.show();
                            newToggleBtn.empty().append('<i class="fa-solid fa-chevron-left"></i>');
                        }
                    })
                }
            }
        }
    } catch (error) {
        console.error(error)
    }
}

async function getFirstWorkspace() {
    let workspace = ''
    for (let i=0; i<10; i++) {
        if (frappe.breadcrumbs.all) {
            workspace = Object.entries(frappe.breadcrumbs.all)?.pop()?.pop()?.workspace;
            if (workspace) {
                break;
            }
        }
        await new Promise(res => setTimeout(res, 50));
    }

    if (!workspace) {
        const route = frappe.get_route();
        workspace = route?.[1];
    }

    return workspace;
}
