(function () {

    let hideCompletedTaskFlag = false;
    let overdueOnlyFlag = false;
    let numOfCompleted = 0;
    const TRUNC_LIMIT = 30;
    const TRUNC_TO = 25;

    function QS(selector) {
        return document.querySelector(selector);
    }

    function QSA(selector) {
        return document.querySelectorAll(selector);
    }

    function ID(id) {
        return document.getElementById(id);
    }

    function CLASS(className) {
        return document.getElementsByClassName(className);
    }

    function TAGNAME(tagName) {
        return document.getElementsByTagName(tagName);
    }

    function CREATE(tagName) {
        return document.createElement(tagName);
    }

    let tasks = [];

    function truncate(input, number, numberTo) {
        if (input.length > number)
            return input.substring(0, numberTo) + '...';
        else
            return input;
    };

    function getFormattedDate(date) {

        if (date == null) {
            return "";
        }
        // date should be Date object
        var year = date.getFullYear();

        var month = (1 + date.getMonth()).toString();
        month = month.length > 1 ? month : '0' + month;

        var day = date.getDate().toString();
        day = day.length > 1 ? day : '0' + day;

        return month + '/' + day + '/' + year;
    }

    // date we get from server is string. This is to change the string to Date object

    let renderTask = function (index) {
        // TODO render HTML element for one item.
        let title = truncate(tasks[index].title, TRUNC_LIMIT, TRUNC_TO);
        let checked = false;
        let tr_class = "";
        if (tasks[index].completed) {
            title = "<del>" + title + "</del>";
            checked = true;
            tr_class += "table-success completed not-overdue";
            if (overdueOnlyFlag || hideCompletedTaskFlag) {
                tr_class += " d-none";
            }
        } else {
            if (new Date(tasks[index].dueDate) < new Date() && tasks[index].dueDate != null) {
                tr_class += "table-danger overdue";
            } else {
                tr_class += "not-overdue";
                if (overdueOnlyFlag) {
                    tr_class += " d-none";
                }
            }
        }

        const tr1 = CREATE("tr");
        tr1.id = index;
        tr1.className = tr_class;
        // first td
        const td1_checkbox = CREATE("td");
        const checkbox = CREATE("input");
        checkbox.type = "checkbox"
        checkbox.className = "form-check-input";
        checkbox.value = index;
        checkbox.checked = checked;
        checkbox.addEventListener("change", function () {
            tasks[this.value].completed = this.checked;
            let completedDate = tasks[this.value].completeDate;
            if (tasks[this.value].completed) {
                completedDate = new Date();
            } else {
                completedDate = null;
            }
            fetch('/updatetask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    _id: tasks[index]._id, // provide the ID of the task to be updated
                    data: {
                        title: tasks[index].title, // provide updated data for the task
                        dueDate: tasks[index].dueDate,
                        completed: tasks[this.value].completed,
                        completeDate: completedDate,
                        createdDate: tasks[index].createdDate,
                        deleted: tasks[index].dedeleted,
                        note: tasks[index].note
                    }
                })
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log('Success:', data);
                    fetchData();
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        });

        td1_checkbox.appendChild(checkbox);
        td1_checkbox.className = "text-center";
        tr1.appendChild(td1_checkbox);

        // second td
        const td2_title = CREATE("td");
        td2_title.innerHTML = title;
        td2_title.className = "text-center";
        tr1.appendChild(td2_title);

        // third td
        const td3_note = CREATE("td");
        td3_note.innerHTML = `<span class ="text-right"><button class = "btn btn-xs btn-warning" data-bs-toggle="collapse" data-bs-target="#note-${index}"><i class="bi bi-caret-down"> </span> Note</button></span`
        td3_note.className = "text-center";
        tr1.appendChild(td3_note);

        // fourth td
        const td4_duedate = CREATE("td");;
        td4_duedate.innerHTML = `<td class = "text-center">${(tasks[index].dueDate ? getFormattedDate(new Date(new Date(tasks[index].dueDate) - 60 * 60 * 24 * 1000)) : "")}</td>`
        td4_duedate.className = "text-center";
        tr1.appendChild(td4_duedate);

        // fifth td
        const td5_completedate = CREATE("td");
        td5_completedate.innerHTML = `<td class = "text-center">${(tasks[index].completeDate ? getFormattedDate(new Date(tasks[index].completeDate)) : "")}</td>`
        td5_completedate.className = "text-center";
        tr1.appendChild(td5_completedate);

        // sixth td
        const td6_buttons = CREATE("td");
        td6_buttons.className = "text-center";

        const udpatebutton = CREATE("button");
        udpatebutton.type = "button";
        udpatebutton.className = "btn btn-warning btn-xs updatetask";
        udpatebutton.alt = "Update the task";
        udpatebutton.value = 0;
        udpatebutton.dataset.bsToggle = 'modal';
        udpatebutton.dataset.bsTarget = '#myUpdateTaskModal';
        udpatebutton.innerHTML = '<i class="bi bi-pencil-square"></i>';
        const titleField = ID('task-title-update');
        const dueDateField = ID('due-date-update');
        const noteField = ID('task-note-update');
        udpatebutton.addEventListener("click", function () {
            QS('input[type="hidden"]').id = tasks[index]._id;
            titleField.value = tasks[index].title;

            if (tasks[index].dueDate != null) {
                dueDateField.value = getFormattedDate(new Date(new Date(tasks[index].dueDate) - 60 * 60 * 24 * 1000));
            }
            else {
                dueDateField.value = "";
            }
            noteField.value = tasks[index].note;
        });




        td6_buttons.appendChild(udpatebutton);
        td6_buttons.appendChild(document.createTextNode(" "));

        const deletebutton = CREATE("button");
        deletebutton.type = "button"
        deletebutton.className = "btn btn-danger btn-xs deletetask";
        deletebutton.alt = "Delete the task";
        deletebutton.value = index;
        deletebutton.innerHTML = `<i class="bi bi-trash"></i>`;
        deletebutton.addEventListener("click", function () {
            if (!confirm("Are you sure?"))
                return;

            fetch('/deletetask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tasks[this.value]),
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log('Success:', data);
                    fetchData();
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        });
        td6_buttons.appendChild(deletebutton);
        td6_buttons.appendChild(document.createTextNode(" "));
        const a_email = CREATE("a");
        const emailbutton = CREATE("button");

        a_email.target = "_blank";
        a_email.href = `mailto:?body=${tasks[index].note}&subject=${tasks[index].title}`;
        emailbutton.type = "button"
        emailbutton.className = "btn btn-danger btn-xs emailtask";
        emailbutton.alt = "Send an email";
        emailbutton.value = index;
        emailbutton.innerHTML = `<i class="bi bi-envelope"></i>`;
        a_email.appendChild(emailbutton);
        td6_buttons.appendChild(a_email);
        tr1.appendChild(td6_buttons);

        const tr2 = CREATE("tr");
        tr2.id = `note-${index}`;
        tr2.className = "collapse";
        const td_note = CREATE("td");
        td_note.setAttribute("colspan", "6");
        td_note.innerHTML = `<div class = "card"><div class = "card-body"><h3>${tasks[index].title}</h3><h4>Due date: ${(tasks[index].dueDate ? getFormattedDate(new Date(new Date(tasks[index].dueDate) - 60 * 60 * 24 * 1000)) : "")} </h4><div>${tasks[index].note.replace(/\r\n|\r|\n/g, "<br/>")}</div></div></div>`;
        tr2.appendChild(td_note);

        return [tr1, tr2];
    }
    let notOverdueTasks;
    let deleteCompletedTasksButton;
    let tbody;
    let renderTasks = function () {
        // TODO render all HTML elements based on the current tasks object.
        // Add event handlers for checkboxes, delete button, and udpate button.
        // using for loop is recommended over using forEach function so that you can use array index.
        // note that renderHTML takes index as its only parameter.
        console.log("rendering");
        tbody.innerHTML = "";
        for (let i = 0; i < tasks.length; i++) {

            if (tasks[i].deleted)
                continue;
            const trs = renderTask(i);
            console.log('hey');
            tbody.appendChild(trs[0]);
            tbody.appendChild(trs[1]);
        }

        notOverdueTasks = CLASS("not-overdue");
        completedTasks = CLASS("completed");
        deleteCompletedTasksButton.disabled = (completedTasks.length == 0);
    };


    let fetchData = function () {
        // TODO replace tasks arrray objects with the ones from the server response.
        // fetchdata should call render tasks 
        fetch('/fetchtasks')
            .then(function (response) {
                return response.json()
            })
            .then(function (data) {
                // do your thing with received data
                tasks = data.data;
                console.log(tasks);
                renderTasks();
            })
            .catch((error) => console.log(error));


    }

    document.addEventListener("DOMContentLoaded", function (event) {
        deleteCompletedTasksButton = ID("deleteCompletedTasks");
        tbody = TAGNAME("tbody")[0];
        fetchData();

        ID("deleteCompletedTasks").addEventListener("click", function (event) {
            event.preventDefault();
            if (!confirm("Do you want to delete " + completedTasks.length + " task" + (completedTasks.length > 1 ? "s?" : "?")))
                return;
            let i = 0;
            QSA('.form-check-input').forEach(function (elem) {
                console.log(elem);
                if (elem.checked) {
                    fetch('/deletetask', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(tasks[i]),
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            console.log('Success:', data);
                        })
                        .catch((error) => {
                            console.error('Error:', error);
                        });
                }
                i++;
                console.log(i);
            })
            fetchData();

        });

        ID("overdue").addEventListener("click", function (event) {
            event.preventDefault();
            this.firstChild.classList.toggle("active");
            for (let i = 0; i < notOverdueTasks.length; i++) {
                notOverdueTasks[i].classList.toggle("d-none");
            }
            deleteCompletedTasksButton.disabled = !deleteCompletedTasksButton.disabled;
            overdueOnlyFlag = !overdueOnlyFlag;
            renderTasks();
        });

        ID("addtask").addEventListener("click", function () {
            taskTitleEl.value = "";
            dueDateEl.value = "";
            taskNoteEl.value = "";

        });

        const modal = new bootstrap.Modal(document.getElementById('addTaskModal'));

        const taskTitleEl = ID("task-title");
        const taskNoteEl = ID("task-note");
        const dueDateEl = ID("due-date");

        QS("button[type=submit]").addEventListener("click", function (event) {
            // check if title is null
            event.preventDefault();

            let title = taskTitleEl.value.trim();
            if (title.length == 0) {
                alert("Task title is required");
                return;
            }
            let dueDate = ID("due-date").value.trim();
            if (dueDate.length == 0) {
                dueDate = null;
            } else {
                if (isNaN(Date.parse(dueDate))) {
                    alert("Check your date format.")
                    return;
                }
                dueDate = new Date(dueDate);
                dueDate.setDate(dueDate.getDate() + 1);
            }
            let note = taskNoteEl.value;

            let newTask = {
                title: title,
                dueDate: dueDate,
                completed: false,
                completeDate: null,
                createdDate: new Date(),
                deleted: false,
                note: note
            };

            modal.hide();

            fetch('/newtask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTask),
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log('Success:', data);
                    setTimeout(fetchData, 15);

                })
                .catch((error) => {
                    console.error('Error:', error);
                })


        });

        ID("refresh").addEventListener("click", function () {
            fetchData();
        });

        const modalU = new bootstrap.Modal(document.getElementById('myUpdateTaskModal'));
        ID("updateSubmit").addEventListener("click", function (event) {
            // check if title is null
            event.preventDefault();

            let title = ID('task-title-update').value.trim();
            if (title.length == 0) {
                alert("Task title is required");
                return;
            }
            let dueDate = ID('due-date-update').value.trim();
            if (dueDate.length == 0) {
                dueDate = null;
            } else {
                if (isNaN(Date.parse(dueDate))) {
                    alert("Check your date format.")
                    return;
                }
                dueDate = new Date(dueDate);
                dueDate.setDate(dueDate.getDate() + 1);
            }
            let note = ID('task-note-update').value;

            fetch('/updatetask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    _id: QS('input[type="hidden"]').id, // provide the ID of the task to be updated
                    data: {
                        title: title, // provide updated data for the task
                        dueDate: dueDate,
                        note: note
                    }
                })
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log('Success:', data);
                    fetchData();
                })
                .catch((error) => {
                    console.error('Error:', error);
                });

            modalU.hide();
        });
    });

})();