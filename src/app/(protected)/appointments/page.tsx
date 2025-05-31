import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DataTable } from "@/components/ui/data-table";
import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import AddAppointmentButton from "./_components/add-appointment-button";
import { appointmentsTableColumns } from "./_components/table-columns";

const AppointmentsPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }

  const [patients, doctors, appointments] = await Promise.all([
    db.select().from(patientsTable).where(eq(patientsTable.clinicId, session.user.clinic.id)),
    db.select().from(doctorsTable).where(eq(doctorsTable.clinicId, session.user.clinic.id)),
    db.select().from(appointmentsTable).where(eq(appointmentsTable.clinicId, session.user.clinic.id)),
  ]);

  const appointmentsWithRelations = appointments.map((appointment) => {
    const patient = patients.find((p) => p.id === appointment.patientId);
    const doctor = doctors.find((d) => d.id === appointment.doctorId);

    return {
      ...appointment,
      patient: patient
        ? {
          id: patient.id,
          name: patient.name,
          email: patient.email,
          phoneNumber: patient.phoneNumber,
          sex: patient.sex,
        }
        : null,
      doctor: doctor
        ? {
          id: doctor.id,
          name: doctor.name,
          specialty: doctor.specialty,
        }
        : null,
    };
  });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Agendamentos</PageTitle>
          <PageDescription>
            Gerencie os agendamentos da sua clínica
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddAppointmentButton patients={patients} doctors={doctors} />
        </PageActions>
      </PageHeader>
      <PageContent>
        <DataTable data={appointmentsWithRelations} columns={appointmentsTableColumns} />
      </PageContent>
    </PageContainer>
  );
};

export default AppointmentsPage;