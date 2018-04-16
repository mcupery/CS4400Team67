$(document).ready(function() {
    var grid, dialog, nationalityDropdown, dateOfBirth, isActiveCheckbox;
    function Edit(e) {
        $('#ID').val(e.data.id);
        $('#Name').val(e.data.record.Name);
        nationalityDropdown.value(e.data.record.CountryID);
        dateOfBirth.value(e.data.record.DateOfBirth);
        isActiveCheckbox.state(e.data.record.IsActive ? 'checked' : 'unchecked');
        dialog.open('Edit Player');
    }
    function Save() {
        var record = {
            ID: $('#ID').val(),
            Name: $('#Name').val(),
            CountryID: nationalityDropdown.value(),
            DateOfBirth: gj.core.parseDate(dateOfBirth.value(), 'mm/dd/yyyy').toISOString(),
            IsActive: $('#IsActive').prop('checked')
        };
        $.ajax({ url: '/Players/Save', data: { record: record }, method: 'POST' })
            .done(function () {
                dialog.close();
                grid.reload();
            })
            .fail(function () {
                alert('Failed to save.');
                dialog.close();
            });
    }
    function Delete(e) {
        if (confirm('Are you sure?')) {
            $.ajax({ url: '/Players/Delete', data: { id: e.data.id }, method: 'POST' })
                .done(function () {
                    grid.reload();
                })
                .fail(function () {
                    alert('Failed to delete.');
                });
        }
    }
    $(document).ready(function () {
        grid = $('#grid').grid({
            primaryKey: 'ID',
            dataSource: '/Players/Get',
            columns: [
                { field: 'ID', width: 56 },
                { field: 'Name', sortable: true },
                { field: 'CountryName', title: 'Nationality', sortable: true },
                { field: 'DateOfBirth', sortable: true, type: 'date' },
                { field: 'IsActive', title: 'Active?', type: 'checkbox', width: 90, align: 'center' },
                { width: 64, tmpl: '<span class="material-icons gj-cursor-pointer">edit</span>', align: 'center', events: { 'click': Edit } },
                { width: 64, tmpl: '<span class="material-icons gj-cursor-pointer">delete</span>', align: 'center', events: { 'click': Delete } }
            ],
            pager: { limit: 5 }
        });
        dialog = $('#dialog').dialog({
            autoOpen: false,
            resizable: false,
            modal: true,
            width: 360
        });
        nationalityDropdown = $('#Nationality').dropdown({ dataSource: '/Locations/GetCountries', valueField: 'id' });
        dateOfBirth = $('#DateOfBirth').datepicker();
        isActiveCheckbox = $('#IsActive').checkbox();
        $('#btnAdd').on('click', function () {
            $('#ID').val('');
            $('#Name').val('');
            nationalityDropdown.value('');
            dateOfBirth.value('');
            isActiveCheckbox.state('unchecked');
            dialog.open('Add Player');
        });
        $('#btnSave').on('click', Save);
        $('#btnCancel').on('click', function () {
            dialog.close();
        });
        $('#btnSearch').on('click', function () {
            grid.reload({ page: 1, name: $('#txtName').val(), nationality: $('#txtNationality').val() });
        });
        $('#btnClear').on('click', function () {
            $('#txtName').val('');
            $('#txtNationality').val('');
            grid.reload({ name: '', nationality: '' });
        });
    });
});